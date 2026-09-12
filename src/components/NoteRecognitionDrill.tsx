'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import ABCJS from 'abcjs';
import {
  Alert, Badge, Box, Button, Card, Chip, Group, Progress, SegmentedControl, Stack, Switch, Text,
} from '@mantine/core';
import {
  answerQuestion, DEFAULT_OPTIONS, describeMidiNote, DrillOptions, DrillPart, DrillQuestion, Hands,
  MAX_PER_STAFF, notePoolForOptions, NotesPerQuestion, octaveLabel, octavesFor, OCTAVES_BY_CLEF,
  pickNextQuestion, questionAbc,
} from '@/lib/midi-notes';
import { OctaveKeyboard } from './OctaveKeyboard';
import { usePianoInput } from '@/hooks/usePianoInput';
import { answersFromHeard } from '@/lib/mic-follow';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';
import {
  anchorTransform, GRAND_STAFF_BOX, GRAND_STAFF_SCALE, SINGLE_STAFF_BOX, SINGLE_STAFF_SCALE,
} from '@/lib/staff-anchor';

/** Thời gian dừng lại sau khi bấm đúng, đủ để nhìn thấy phản hồi rồi mới sang nốt mới. */
const ADVANCE_DELAY_MS = 900;

const STORAGE_KEY = 'note-trainer-options';

const HAND_LABELS: { value: Hands; label: string }[] = [
  { value: 'right', label: 'Tay phải' },
  { value: 'left', label: 'Tay trái' },
  { value: 'both', label: 'Cả hai tay' },
];

const COUNT_LABELS: { value: NotesPerQuestion; label: string }[] = [
  { value: 'one', label: '1 nốt' },
  { value: 'both', label: '2 nốt' },
  { value: 'mixed', label: 'Lúc 1 lúc 2' },
];

/**
 * Kho nhớ lựa chọn giữa hai buổi tập.
 *
 * Vì sao phải qua `useSyncExternalStore` chứ không đọc thẳng `localStorage` lúc
 * dựng state: bảng chọn này nằm ngay trong lần vẽ đầu tiên, mà máy chủ không có
 * `localStorage`. Đọc thẳng là HTML của máy chủ (mặc định) khác HTML của máy
 * người học (đã lưu) — React báo lệch hydration. `useSyncExternalStore` sinh ra
 * đúng cho chuyện này: nó dùng ảnh chụp của máy chủ trong lúc hydrate rồi mới
 * đổi sang ảnh chụp thật.
 */
const listeners = new Set<() => void>();
let cached: DrillOptions | null = null;

function loadOptions(): DrillOptions {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    const saved = JSON.parse(raw) as Partial<DrillOptions>;
    const hands: Hands = saved.hands === 'left' || saved.hands === 'both' ? saved.hands : 'right';
    const valid = octavesFor(hands);
    const octaves = Array.isArray(saved.octaves)
      ? saved.octaves.filter((o) => typeof o === 'number' && valid.includes(o))
      : [];
    const count: NotesPerQuestion = saved.notesPerQuestion === 'both' || saved.notesPerQuestion === 'mixed'
      ? saved.notesPerQuestion
      : 'one';
    const maxPerStaff = typeof saved.maxPerStaff === 'number'
      ? Math.max(1, Math.min(MAX_PER_STAFF, Math.round(saved.maxPerStaff)))
      : 1;
    return {
      hands,
      octaves: octaves.length > 0 ? octaves : DEFAULT_OPTIONS.octaves,
      fiveFinger: saved.fiveFinger !== false,
      accidentals: saved.accidentals === true,
      notesPerQuestion: count,
      maxPerStaff,
      randomKeys: saved.randomKeys === true,
    };
  } catch {
    // Chế độ riêng tư chặn localStorage, hoặc dữ liệu cũ sai dạng sau khi đổi mã.
    return DEFAULT_OPTIONS;
  }
}

/** Phải trả về CÙNG một đối tượng cho tới khi có thay đổi thật, không thì React vẽ lại vô tận. */
function getSnapshot(): DrillOptions {
  if (!cached) cached = loadOptions();
  return cached;
}

function getServerSnapshot(): DrillOptions {
  return DEFAULT_OPTIONS;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function storeOptions(next: DrillOptions) {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Không lưu được thì thôi, buổi tập vẫn chạy bình thường.
  }
  for (const onChange of listeners) onChange();
}

type Feedback =
  | { kind: 'none' }
  /** Câu hai nốt, mới bấm đúng một nốt — còn chờ nốt kia. */
  | { kind: 'partial'; done: DrillPart }
  | { kind: 'correct' }
  | { kind: 'wrong-octave'; played: number }
  | { kind: 'wrong'; played: number };

export function NoteRecognitionDrill() {
  const options = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pool = useMemo(() => notePoolForOptions(options), [options]);
  const selectableOctaves = useMemo(() => octavesFor(options.hands), [options.hands]);
  const activeMidis = useMemo(() => new Set(pool.map((p) => p.note.midi)), [pool]);
  /**
   * Tách kho câu hỏi theo khóa nhạc.
   *
   * Cần vì một quãng chỉ đọc được ở một khóa: chọn bốn quãng với cả hai tay
   * không ra 4×2 phần bài. Không nói ra thì người học đếm nốt thấy hụt và tưởng
   * app nuốt mất nốt — chính là câu hỏi đã nhận được.
   */
  const theoKhoa = useMemo(() => ({
    treble: {
      notes: pool.filter((p) => p.clef === 'treble').length,
      octaves: options.octaves.filter((o) => OCTAVES_BY_CLEF.treble.includes(o)),
    },
    bass: {
      notes: pool.filter((p) => p.clef === 'bass').length,
      octaves: options.octaves.filter((o) => OCTAVES_BY_CLEF.bass.includes(o)),
    },
  }), [pool, options.octaves]);
  /** Cả hai tay thì vẽ khuông đôi như bản nhạc piano thật. */
  const grandStaff = options.hands === 'both';

  const [current, setCurrent] = useState<DrillQuestion | null>(
    () => pickNextQuestion(DEFAULT_OPTIONS, null),
  );
  /**
   * Những nốt của câu hiện tại đã bấm đúng.
   *
   * Câu hai nốt phải bấm đủ cả hai mới tính xong, mà hai tay không bao giờ chạm
   * phím đúng cùng một mili giây — nên phải nhớ nốt nào đã đúng rồi. Giữ trong
   * state (không phải ref) vì màn hình cần hiện "còn nốt ở khuông kia".
   */
  const [collected, setCollected] = useState<number[]>([]);
  /**
   * Bản gốc của `collected`, giữ trong ref.
   *
   * Micro đưa cả hai nốt của một câu trong cùng một nhịp, nên `handleNoteOn` chạy
   * hai lần liền nhau trước khi React kịp vẽ lại. Đọc state thì lần thứ hai vẫn
   * thấy giá trị cũ và câu không bao giờ xong — ref là chỗ duy nhất đọc ra được
   * giá trị vừa ghi.
   */
  const collectedRef = useRef<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'none' });
  const [answered, setAnswered] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [mistakes, setMistakes] = useState<Record<number, number>>({});

  /** Khoá không nhận phím trong lúc đang hiện "Chính xác" và chờ sang nốt mới. */
  const lockedRef = useRef(false);
  /** Nốt hiện tại đã bấm sai lần nào chưa — để tính tỷ lệ đúng ngay lần đầu. */
  const missedCurrentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  /*
   * **Đổi lựa chọn thì bốc nốt mới và xoá thống kê, ngay trong lúc vẽ.**
   *
   * Đây là cách React khuyên dùng để đặt lại state khi đầu vào đổi, thay cho một
   * `useEffect` — hiệu ứng sẽ vẽ một lần bằng nốt cũ rồi mới sửa, người học kịp
   * thấy nốt cũ nháy lên. So sánh bằng `!==` là đủ vì `getSnapshot` giữ nguyên
   * đối tượng cho tới khi có thay đổi thật.
   *
   * Chỗ này chạy cả khi hydrate xong và lựa chọn đã lưu thay cho mặc định.
   *
   * Chỉ đụng tới state, không đụng tới ref — React cấm đọc và ghi ref trong lúc
   * vẽ. Mấy cái ref (đồng hồ chờ, cờ khoá phím) được đặt lại ở `applyOptions`,
   * tức trong tay người bấm. Đường hydrate không cần: lúc đó chưa ai trả lời
   * câu nào nên ref vẫn đang ở giá trị ban đầu.
   *
   * Xoá thống kê là có chủ ý: tỷ lệ đúng của năm nốt thế tay Đô và của cả bàn
   * phím không so được với nhau, gộp chung một con số là con số vô nghĩa.
   */
  const [shownFor, setShownFor] = useState(options);
  if (shownFor !== options) {
    setShownFor(options);
    setCurrent(pickNextQuestion(options, null));
    setCollected([]);
    setFeedback({ kind: 'none' });
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
  }

  const advance = useCallback((previous: DrillQuestion | null, forOptions: DrillOptions) => {
    lockedRef.current = false;
    missedCurrentRef.current = false;
    collectedRef.current = [];
    setFeedback({ kind: 'none' });
    setCollected([]);
    setCurrent(pickNextQuestion(forOptions, previous));
  }, []);

  /**
   * Nhận một phím vừa bấm.
   *
   * Toàn bộ luật so phím nằm ở `answerQuestion`; chỗ này chỉ lo phần màn hình và
   * thống kê. Đọc nốt đã đúng từ **ref** chứ không từ state — xem `collectedRef`.
   */
  const handleNoteOn = (played: number) => {
    if (lockedRef.current || !current) return;
    const outcome = answerQuestion(current, collectedRef.current, played);

    // Nốt đã đúng, nghe lại lần nữa: không làm gì cả. Xem `answerQuestion`.
    if (outcome.kind === 'again') return;

    if (outcome.kind === 'partial') {
      collectedRef.current = outcome.collected;
      setCollected(outcome.collected);
      setFeedback({ kind: 'partial', done: outcome.done });
      return;
    }

    if (outcome.kind === 'correct') {
      lockedRef.current = true;
      collectedRef.current = outcome.collected;
      setCollected(outcome.collected);
      setFeedback({ kind: 'correct' });
      setAnswered((n) => n + 1);
      if (!missedCurrentRef.current) setFirstTryCorrect((n) => n + 1);
      timerRef.current = setTimeout(() => advance(current, options), ADVANCE_DELAY_MS);
      return;
    }

    // Sai: tính một lần cho cả câu, và ghi vào sổ nhầm những nốt còn đang chờ.
    if (!missedCurrentRef.current) {
      missedCurrentRef.current = true;
      const conThieu = current.parts.filter((p) => !collectedRef.current.includes(p.note.midi));
      setMistakes((m) => {
        const next = { ...m };
        for (const p of conThieu) next[p.note.midi] = (next[p.note.midi] ?? 0) + 1;
        return next;
      });
    }
    setFeedback({ kind: outcome.kind, played });
  };

  // Micro chỉ nghe trong tầm đang tập, nới mỗi bên một quãng tám để vẫn bắt được
  // khi người học đặt nhầm tay sang quãng khác (thành câu "sai quãng tám").
  const micRange = useMemo<[number, number]>(() => {
    if (pool.length === 0) return [48, 72];
    const midis = pool.map((p) => p.note.midi);
    return [Math.min(...midis) - 12, Math.max(...midis) + 12];
  }, [pool]);

  const input = usePianoInput(
    {
      onMidiNote: handleNoteOn,
      onMicHeard: (event) => {
        if (!current) return;
        // Câu hai nốt thì micro nghe cả hai trong cùng một lần — đưa hết vào, mỗi
        // nốt tự tìm chỗ của nó. Không khớp gì thì chỉ báo sai MỘT lần.
        const conThieu = current.parts.filter((p) => !collectedRef.current.includes(p.note.midi));
        for (const midi of answersFromHeard(event.notes, conThieu.map((p) => p.note.midi))) {
          handleNoteOn(midi);
        }
      },
    },
    // Báo trước nốt đang hỏi: đã kiểm trên hàng chục lần trả lời sai rằng gợi ý này
    // không bao giờ biến một lần đánh sai thành "Chính xác" (mic-accuracy.test.ts).
    {
      hint: current ? current.parts.map((p) => p.note.midi) : [],
      range: micRange,
      // Đủ chỗ cho mọi nốt của câu, cộng một nốt lạ để còn báo được bấm sai.
      maxNotes: Math.min(6, (current?.parts.length ?? 1) + 1),
    },
  );

  /*
   * Vẽ lại khuông nhạc mỗi khi đổi câu hỏi hoặc đổi số khuông — rồi **neo nó lại**.
   *
   * abcjs vẽ ảnh cao vừa đúng nội dung, nên nốt càng nhiều dòng kẻ phụ thì ảnh
   * càng cao và năm dòng kẻ trôi đi mỗi câu một chỗ. Sau khi vẽ xong, đo dòng kẻ
   * trên cùng rồi dịch ảnh về đúng chỗ neo — luật tính nằm ở `staff-anchor.ts`.
   */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    if (!current) {
      paper.innerHTML = '';
      return;
    }
    const abcScale = grandStaff ? GRAND_STAFF_SCALE : SINGLE_STAFF_SCALE;
    ABCJS.renderAbc(paper, questionAbc(current, grandStaff), {
      /*
       * Khuông đôi cao gấp đôi khuông đơn nên phải thu nhỏ lại — không thì trên
       * điện thoại nó đẩy hết phần phản hồi và hai cái nút xuống dưới màn hình.
       * Hẹp hơn một chút nữa để cả dấu ngoặc ôm hai khuông lẫn vạch nhịp cuối
       * nằm trọn trong khung, khác khuông đơn chỉ có mỗi nốt ở giữa nên hai mép
       * trống bị cắt cũng không mất gì.
       */
      staffwidth: grandStaff ? 190 : 220,
      scale: abcScale,
      paddingtop: 8,
      paddingbottom: 8,
      paddingleft: 0,
      paddingright: 0,
    });

    const svg = paper.querySelector('svg');
    const topLine = paper.querySelector('.abcjs-top-line');
    if (!svg || !topLine) return;

    /*
     * abcjs bọc ảnh trong một thẻ `div` của riêng nó và đặt thẳng
     * `overflow: hidden` cùng chiều cao đúng bằng ảnh CHƯA dịch. Phép neo bên
     * dưới dịch ảnh xuống, nên phần thò ra khỏi chiều cao đó bị cắt — mất mấy
     * dòng kẻ dưới cùng của khuông Pha mà không có lỗi nào báo ra. Trả nó về
     * `visible` sau mỗi lần vẽ (abcjs ghi lại thuộc tính này mỗi lần); chỗ cắt
     * thật là cái khung ngoài, đúng như phép neo giả định.
     */
    paper.style.overflow = 'visible';

    /*
     * Đo **trong hệ toạ độ của chính ảnh SVG** bằng `getBBox`, không dùng
     * `getBoundingClientRect`: toạ độ màn hình phụ thuộc vào chỗ ảnh nằm trong
     * trang, mà lúc effect chạy thì trang chưa xếp xong chỗ cho nó — đã thử và
     * lệch 7px.
     *
     * `getBBox` trả về đơn vị TRƯỚC khi nhân tỉ lệ, nên phải nhân `abcScale` vào
     * mới ra px thật trên màn hình.
     */
    const ink = svg.getBBox();
    const topLineY = (topLine as SVGGraphicsElement).getBBox().y * abcScale;
    const { scale, translateY } = anchorTransform(
      grandStaff ? GRAND_STAFF_BOX : SINGLE_STAFF_BOX,
      topLineY,
      ink.y * abcScale,
      (ink.y + ink.height) * abcScale,
    );

    /*
     * **Ghi lại CẢ tỉ lệ của abcjs**, vì abcjs cài tuỳ chọn `scale` bằng chính
     * `style.transform` này. Chỉ ghi phép dịch là xoá luôn tỉ lệ ấy và bản nhạc
     * bị vẽ nhỏ đi một nửa mà không có lỗi nào báo ra. Gốc toạ độ để `0 0` cho
     * khớp với abcjs, không thì ảnh còn xê ngang.
     */
    svg.style.transformOrigin = '0 0';
    svg.style.transform = `translateY(${translateY}px) scale(${abcScale * scale})`;
  }, [current, grandStaff]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  /**
   * Đổi lựa chọn: chỉ cần ghi vào kho nhớ. Việc bốc nốt mới và xoá thống kê do
   * khối chỉnh state ở trên lo, nên không có hai chỗ cùng đặt lại một thứ.
   */
  const applyOptions = (next: DrillOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    lockedRef.current = false;
    missedCurrentRef.current = false;
    collectedRef.current = [];
    storeOptions(next);
  };

  /**
   * Đổi tay thì phải lọc lại quãng đang chọn: quãng 6 không đọc được ở khóa Pha,
   * quãng 1 không đọc được ở khóa Sol. Lọc xong mà rỗng thì lấy quãng gần Đô giữa
   * nhất còn dùng được — đổi tay không bao giờ được dẫn tới màn hình trống.
   */
  const changeHands = (value: string) => {
    const hands = value as Hands;
    const valid = octavesFor(hands);
    const kept = options.octaves.filter((o) => valid.includes(o));
    const fallback = valid.includes(4) ? 4 : valid[valid.length - 1];
    applyOptions({ ...options, hands, octaves: kept.length > 0 ? kept : [fallback] });
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance(current, options);
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
    advance(current, options);
  };

  const accuracy = answered > 0 ? Math.round((firstTryCorrect / answered) * 100) : 0;
  const worstNotes = Object.entries(mistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, count]) => {
      const found = pool.find((q) => q.note.midi === Number(m));
      return {
        label: found ? `${found.note.name} (${found.note.scientific})` : describeMidiNote(Number(m)),
        count,
      };
    });

  return (
    <Stack gap="lg">
      <Card withBorder padding="md" data-testid="drill-options">
        <Text size="sm" fw={500} mb={6}>Tập tay nào</Text>
        <SegmentedControl
          className="drill-hands-picker"
          fullWidth
          value={options.hands}
          onChange={changeHands}
          data={HAND_LABELS}
          data-testid="hands-picker"
        />

        <Text size="sm" fw={500} mt="md" mb={6}>
          Quãng nào <Text span size="xs" c="dimmed">— chọn được nhiều quãng, vùng chọn hiện lên hình đàn</Text>
        </Text>
        <OctaveKeyboard
          activeMidis={activeMidis}
          selectedOctaves={options.octaves}
          selectableOctaves={selectableOctaves}
        />
        {/*
          Nút chọn nằm DƯỚI hình đàn, không phải chạm thẳng lên đàn: xem lý do ở
          `OctaveKeyboard`. Nhãn nút trùng đúng nhãn ghi trên hình, để nhìn nút là
          biết nó bôi vùng nào.
        */}
        <Chip.Group
          multiple
          value={options.octaves.map(String)}
          onChange={(value) => applyOptions({
            ...options,
            octaves: value.map(Number).sort((a, b) => a - b),
          })}
        >
          <Group gap={6} mt="sm">
            {selectableOctaves.map((octave) => (
              <Chip key={octave} value={String(octave)} size="sm" data-testid={`octave-chip-${octave}`}>
                {octaveLabel(octave)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Text size="xs" c="dimmed" mt={6}>
          {options.octaves.length > 0
            ? 'Chạm lần nữa để bỏ chọn. Vùng xanh trên hình đàn là chỗ đang tập.'
            : 'Chưa chọn quãng nào — chạm một nút ở trên.'}
        </Text>

        {/*
          Chỉ có nghĩa khi tập cả hai tay: một khuông thì "hai nốt hai khóa" không
          tồn tại. Ẩn hẳn thay vì để mờ — một ô chọn bấm không được chỉ làm người
          học tưởng app hỏng.
        */}
        {grandStaff && (
          <>
            <Text size="sm" fw={500} mt="md" mb={6}>
              Mỗi câu mấy nốt
            </Text>
            <SegmentedControl
              className="drill-hands-picker"
              fullWidth
              value={options.notesPerQuestion}
              onChange={(value) => applyOptions({ ...options, notesPerQuestion: value as NotesPerQuestion })}
              data={COUNT_LABELS}
              data-testid="count-picker"
            />
            <Text size="xs" c="dimmed" mt={6}>
              {options.notesPerQuestion === 'one' && 'Mỗi câu một nốt, nằm ở khuông trên hoặc khuông dưới.'}
              {options.notesPerQuestion === 'both' && 'Mỗi câu hai nốt cùng lúc, mỗi khuông một nốt — bấm đủ cả hai mới sang câu mới.'}
              {options.notesPerQuestion === 'mixed' && 'Khi một nốt khi hai nốt, không đoán trước được — sát bản nhạc thật nhất.'}
            </Text>
          </>
        )}

        <Text size="sm" fw={500} mt="md" mb={6}>
          Tối đa mấy nốt mỗi khuông
        </Text>
        <SegmentedControl
          className="drill-hands-picker"
          fullWidth
          value={String(options.maxPerStaff)}
          onChange={(value) => applyOptions({ ...options, maxPerStaff: Number(value) })}
          data={Array.from({ length: MAX_PER_STAFF }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} nốt`,
          }))}
          data-testid="stack-picker"
        />
        <Text size="xs" c="dimmed" mt={6}>
          {options.maxPerStaff === 1
            ? 'Mỗi khuông đúng một nốt.'
            : `Mỗi khuông bốc từ 1 tới ${options.maxPerStaff} nốt chồng lên nhau như hợp âm — câu nào cũng đủ chồng thì không giống bản nhạc thật. Chồng nốt luôn nằm trong tầm một bàn tay.`}
          {options.maxPerStaff > 1 && input.mode === 'mic'
            && ' Micro nghe chồng nốt khó hơn nghe một nốt; dây MIDI thì chính xác tuyệt đối.'}
        </Text>

        <Switch
          mt="md"
          checked={options.fiveFinger}
          onChange={(e) => applyOptions({ ...options, fiveFinger: e.currentTarget.checked })}
          label="Chỉ năm nốt Đô–Sol"
          description="Thế tay 5 ngón của Chương 1: cả bàn tay đứng yên một chỗ. Tắt đi thì tập trọn bảy nốt Đô–Si của mỗi quãng."
          data-testid="five-finger-switch"
        />

        {/*
          Hoá biểu KHÔNG cho chọn một giọng rồi giữ nguyên: chọn cố định thì sau
          vài câu người học thuộc lòng "đang Sol trưởng" và thôi không nhìn đầu
          khuông nữa — mà nhìn hoá biểu rồi nhớ nó chính là việc cần rèn.
        */}
        <Switch
          mt="md"
          checked={options.randomKeys}
          onChange={(e) => applyOptions({ ...options, randomKeys: e.currentTarget.checked })}
          label="Đổi hoá biểu mỗi câu"
          description="Mỗi câu bốc một giọng khác trong bảy giọng thông dụng (0-3 dấu), dấu đứng ở đầu khuông đúng như bản nhạc thật. Nốt nằm trong hoá biểu thì không có dấu nào bên cạnh — phải nhìn đầu khuông mà nhớ. Tắt thì câu nào cũng Đô trưởng, không dấu."
          data-testid="random-keys-switch"
        />

        <Switch
          mt="sm"
          checked={options.accidentals}
          onChange={(e) => applyOptions({ ...options, accidentals: e.currentTarget.checked })}
          label="Thêm nốt hoá bất thường"
          description="Nốt nằm NGOÀI hoá biểu, có dấu thăng, giáng hoặc bình viết ngay cạnh nốt — bản nhạc thật cũng làm thế khi cần một nốt lạ."
          data-testid="accidentals-switch"
        />

        <Text size="xs" c="dimmed" mt="md" data-testid="pool-size">
          Đang tập <b>{pool.length}</b> nốt
          {grandStaff ? ', hiện cả hai khuông như bản nhạc piano' : ''}.
        </Text>
        {/*
          Chỉ hiện khi tập cả hai tay, vì chỉ lúc đó mới có chuyện một quãng thuộc
          về tay này mà không thuộc tay kia.
        */}
        {grandStaff && (
          <Text size="xs" c="dimmed" mt={4} data-testid="pool-split">
            Khóa Sol {theoKhoa.treble.notes} nốt
            {theoKhoa.treble.octaves.length > 0 && ` (${theoKhoa.treble.octaves.map(octaveLabel).join(', ')})`}
            {' · '}
            khóa Pha {theoKhoa.bass.notes} nốt
            {theoKhoa.bass.octaves.length > 0 && ` (${theoKhoa.bass.octaves.map(octaveLabel).join(', ')})`}.
            {' '}
            Quãng quá cao thì khóa Pha không đọc được, quãng quá trầm thì khóa Sol không —
            nên một quãng có khi chỉ tập được ở một tay.
          </Text>
        )}

      </Card>

      {input.mode ? (
        <PianoInputStatus input={input} />
      ) : (
        <PianoInputChooser
          input={input}
          title="Để app nghe bạn đánh"
          description="Chọn một cách để app biết bạn vừa bấm phím nào trên đàn thật."
        />
      )}

      <Card withBorder padding="lg" data-testid="drill-card">
        <Stack align="center" gap="md">
          {current ? (
            <>
              <Text size="sm" c="dimmed">
                {current.parts.length > 1
                  ? `${current.parts.length} nốt này là nốt gì? Bấm đủ cả ${current.parts.length} trên đàn — không cần cùng lúc, nốt nào trước cũng được.`
                  : 'Nốt này là nốt gì? Hãy bấm phím tương ứng trên đàn.'}
                {/* Khuông đôi đã tự nói nốt nằm ở tay nào, nên không nhắc thêm —
                    nhắc ra là trả lời hộ nửa câu hỏi. */}
                {grandStaff && current.parts.length === 1 && ' Để ý nốt nằm ở khuông trên hay khuông dưới.'}
                {/* Nhắc nhìn hoá biểu chứ KHÔNG nói giọng gì — nói ra là trả lời hộ. */}
                {options.randomKeys && ' Hoá biểu đầu khuông mỗi câu một khác, nhìn nó trước đã.'}
              </Text>

              {/* Khuông nhạc luôn để nền trắng chữ đen như bản nhạc giấy, kể cả khi trang đang ở chế độ tối. */}
              {/*
                Khung CAO CỐ ĐỊNH và không canh giữa theo chiều dọc: vị trí khuông
                nhạc do phép neo trong effect quyết, canh giữa nữa là hai thứ tranh
                nhau. `overflow: hidden` chỉ là lưới an toàn — phép neo đã thu nhỏ
                cho vừa rồi.
              */}
              <div
                data-testid="staff"
                style={{
                  background: '#fff',
                  color: '#000',
                  border: '1px solid #d0d0d0',
                  borderRadius: 16,
                  padding: '0.5rem 1rem',
                  height: grandStaff ? GRAND_STAFF_BOX.height : SINGLE_STAFF_BOX.height,
                  width: '100%',
                  maxWidth: 320,
                  overflow: 'hidden',
                }}
              >
                <div ref={paperRef} />
              </div>

              <Box mih={78} w="100%">
                {feedback.kind === 'partial' && (
                  <Alert color="teal" variant="light" title="Đúng rồi, còn nữa" data-testid="feedback-partial">
                    <b>{feedback.done.note.name} ({feedback.done.note.scientific})</b>
                    {grandStaff && ` ở ${feedback.done.clef === 'treble' ? 'khuông trên' : 'khuông dưới'}`}
                    {' '}đúng rồi. Giữ nguyên ngón đó và bấm{' '}
                    <b>{current.parts.length - collected.length} nốt</b> còn lại.
                  </Alert>
                )}
                {feedback.kind === 'correct' && (
                  <Alert color="teal" title="Chính xác" data-testid="feedback-correct">
                    Đó là{' '}
                    {current.parts.map((p, i) => (
                      <span key={p.note.midi}>
                        {i > 0 && ' và '}
                        <b>{p.note.name} ({p.note.scientific})</b>
                      </span>
                    ))}.
                    {/*
                      Tên giọng chỉ hiện SAU khi đã trả lời xong. Hiện lúc đang hỏi
                      là làm hộ phần đọc hoá biểu, mà đó mới là phần cần rèn.
                    */}
                    {options.randomKeys && <> Câu này ở giọng <b>{current.key.label}</b>.</>}
                  </Alert>
                )}
                {feedback.kind === 'wrong-octave' && (
                  <Alert color="yellow" title="Đúng tên nốt, nhưng sai quãng tám" data-testid="feedback-octave">
                    Bạn đọc đúng tên nốt rồi. Chỉ là tay đang đặt ở quãng khác — nốt đang chờ nằm ở{' '}
                    <b>
                      {current.parts
                        .filter((p) => !collected.includes(p.note.midi))
                        .map((p) => `${p.note.scientific} (${p.clef === 'treble' ? 'khuông trên' : 'khuông dưới'})`)
                        .join(' và ')}
                    </b>. Cứ thử lại, không tính là sai hẳn đâu.
                  </Alert>
                )}
                {feedback.kind === 'wrong' && (
                  <Alert color="orange" title="Chưa đúng" data-testid="feedback-wrong">
                    {/* Với micro thì nói "máy nghe thấy", không nói "bạn vừa bấm": micro có thể
                        nghe nhầm, và người học đánh đúng mà bị bảo là bấm sai thì mất lòng tin. */}
                    {input.mode === 'mic' ? 'Máy nghe thấy' : 'Bạn vừa bấm'} <b>{describeMidiNote(feedback.played)}</b>.
                    Cứ từ từ đếm dòng và khe trên khuông nhạc rồi thử lại — không có giới hạn thời gian nào cả.
                    {input.mode === 'mic' && ' Nếu chắc mình đánh đúng thì có thể máy nghe nhầm: đánh lại rõ hơn một chút.'}
                  </Alert>
                )}
              </Box>

              <Group justify="center">
                <Button variant="default" size="md" onClick={skip}>
                  {current.parts.length > 1 ? 'Bỏ qua câu này' : 'Bỏ qua nốt này'}
                </Button>
                <Button variant="subtle" color="gray" size="md" onClick={restart}>Làm lại từ đầu</Button>
              </Group>
            </>
          ) : (
            <Alert color="gray" title="Chưa có nốt nào để hỏi" data-testid="empty-pool" w="100%">
              Chọn ít nhất một quãng ở trên thì bài luyện mới bắt đầu được.
            </Alert>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Group justify="space-between" mb="xs">
          <Text fw={500}>Kết quả buổi luyện</Text>
          <Badge variant="light" data-testid="stats-answered">{answered} nốt đã trả lời</Badge>
        </Group>
        <Text size="sm" c="dimmed" mb={6}>
          Đúng ngay lần đầu: <b data-testid="stats-accuracy">{firstTryCorrect}/{answered}</b>
          {answered > 0 ? ` (${accuracy}%)` : ''}
        </Text>
        <Progress value={accuracy} color={accuracy >= 80 ? 'teal' : accuracy >= 50 ? 'yellow' : 'orange'} />
        {worstNotes.length > 0 && (
          <Box mt="md">
            <Text size="sm" fw={500} mb={4}>Nốt hay nhầm nhất</Text>
            {worstNotes.map((n) => (
              <Text key={n.label} size="sm" c="dimmed">• {n.label} — nhầm {n.count} lần</Text>
            ))}
            <Text size="xs" c="dimmed" mt={6}>
              Đây là những nốt đáng dành thêm vài phút. Nếu cùng một nốt cứ nhầm mãi, hãy quay lại
              đọc phần lý thuyết của chương tương ứng thay vì tập tiếp.
            </Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}
