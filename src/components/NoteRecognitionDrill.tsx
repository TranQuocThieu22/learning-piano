'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import ABCJS from 'abcjs';
import {
  Alert, Badge, Box, Button, Card, Chip, Group, Progress, SegmentedControl, Stack, Switch, Text,
} from '@mantine/core';
import {
  checkAnswer, DEFAULT_OPTIONS, describeMidiNote, DrillOptions, DrillQuestion, Hands,
  pickNextQuestion, questionsForOptions, rangesFor, singleNoteAbc,
} from '@/lib/midi-notes';
import { usePianoInput } from '@/hooks/usePianoInput';
import { answerFromHeard } from '@/lib/mic-follow';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';

/** Thời gian dừng lại sau khi bấm đúng, đủ để nhìn thấy phản hồi rồi mới sang nốt mới. */
const ADVANCE_DELAY_MS = 900;

const STORAGE_KEY = 'note-trainer-options';

const HAND_LABELS: { value: Hands; label: string }[] = [
  { value: 'right', label: 'Tay phải' },
  { value: 'left', label: 'Tay trái' },
  { value: 'both', label: 'Cả hai tay' },
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
    const valid = rangesFor(hands).map((r) => r.id);
    const rangeIds = Array.isArray(saved.rangeIds) ? saved.rangeIds.filter((id) => valid.includes(id)) : [];
    return {
      hands,
      rangeIds: rangeIds.length > 0 ? rangeIds : DEFAULT_OPTIONS.rangeIds,
      accidentals: saved.accidentals === true,
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
  | { kind: 'correct' }
  | { kind: 'wrong-octave'; played: number }
  | { kind: 'wrong'; played: number };

export function NoteRecognitionDrill() {
  const options = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pool = useMemo(() => questionsForOptions(options), [options]);
  const ranges = useMemo(() => rangesFor(options.hands), [options.hands]);

  const [current, setCurrent] = useState<DrillQuestion | null>(() => {
    const first = questionsForOptions(DEFAULT_OPTIONS);
    return first.length > 0 ? pickNextQuestion(first, null) : null;
  });
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
    setCurrent(pool.length > 0 ? pickNextQuestion(pool, null) : null);
    setFeedback({ kind: 'none' });
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
  }

  const advance = useCallback((next: DrillQuestion[], previous: DrillQuestion | null) => {
    lockedRef.current = false;
    missedCurrentRef.current = false;
    setFeedback({ kind: 'none' });
    setCurrent(next.length > 0 ? pickNextQuestion(next, previous) : null);
  }, []);

  const handleNoteOn = (played: number) => {
    if (lockedRef.current || !current) return;
    const verdict = checkAnswer(played, current.note.midi);

    if (verdict === 'correct') {
      lockedRef.current = true;
      setFeedback({ kind: 'correct' });
      setAnswered((n) => n + 1);
      if (!missedCurrentRef.current) setFirstTryCorrect((n) => n + 1);
      timerRef.current = setTimeout(() => advance(pool, current), ADVANCE_DELAY_MS);
      return;
    }

    if (!missedCurrentRef.current) {
      missedCurrentRef.current = true;
      setMistakes((m) => ({ ...m, [current.note.midi]: (m[current.note.midi] ?? 0) + 1 }));
    }
    setFeedback(verdict === 'wrong-octave' ? { kind: 'wrong-octave', played } : { kind: 'wrong', played });
  };

  // Micro chỉ nghe trong tầm đang tập, nới mỗi bên một quãng tám để vẫn bắt được
  // khi người học đặt nhầm tay sang quãng khác (thành câu "sai quãng tám").
  const micRange = useMemo<[number, number]>(() => {
    if (pool.length === 0) return [48, 72];
    const midis = pool.map((q) => q.note.midi);
    return [Math.min(...midis) - 12, Math.max(...midis) + 12];
  }, [pool]);

  const input = usePianoInput(
    {
      onMidiNote: handleNoteOn,
      onMicHeard: (event) => {
        if (!current) return;
        const answer = answerFromHeard(event.notes, current.note.midi);
        if (answer !== null) handleNoteOn(answer);
      },
    },
    // Báo trước nốt đang hỏi: đã kiểm trên hàng chục lần trả lời sai rằng gợi ý này
    // không bao giờ biến một lần đánh sai thành "Chính xác" (mic-accuracy.test.ts).
    { hint: current ? [current.note.midi] : [], range: micRange, maxNotes: 2 },
  );

  // Vẽ lại khuông nhạc mỗi khi đổi nốt hoặc đổi khóa nhạc.
  useEffect(() => {
    if (!paperRef.current) return;
    if (!current) {
      paperRef.current.innerHTML = '';
      return;
    }
    ABCJS.renderAbc(paperRef.current, singleNoteAbc(current.note, current.clef), {
      staffwidth: 220,
      scale: 2,
      paddingtop: 8,
      paddingbottom: 8,
      paddingleft: 0,
      paddingright: 0,
    });
  }, [current]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  /**
   * Đổi lựa chọn: chỉ cần ghi vào kho nhớ. Việc bốc nốt mới và xoá thống kê do
   * khối chỉnh state ở trên lo, nên không có hai chỗ cùng đặt lại một thứ.
   */
  const applyOptions = (next: DrillOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    lockedRef.current = false;
    missedCurrentRef.current = false;
    storeOptions(next);
  };

  /**
   * Đổi tay thì phải lọc lại vùng đang chọn: quãng trên không vẽ ở khóa Pha, quãng
   * trầm không vẽ ở khóa Sol. Lọc xong mà rỗng thì lấy vùng đầu tiên còn hợp lệ —
   * đổi tay không bao giờ được dẫn tới màn hình trống.
   */
  const changeHands = (value: string) => {
    const hands = value as Hands;
    const valid = rangesFor(hands).map((r) => r.id);
    const kept = options.rangeIds.filter((id) => valid.includes(id));
    applyOptions({ ...options, hands, rangeIds: kept.length > 0 ? kept : [valid[0]] });
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance(pool, current);
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
    advance(pool, current);
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
          Quãng nào <Text span size="xs" c="dimmed">— chọn được nhiều quãng cùng lúc</Text>
        </Text>
        <Chip.Group
          multiple
          value={options.rangeIds}
          onChange={(value) => applyOptions({ ...options, rangeIds: value })}
        >
          <Group gap="xs">
            {ranges.map((r) => (
              <Chip key={r.id} value={r.id} size="sm" data-testid={`range-${r.id}`}>
                {r.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Text size="xs" c="dimmed" mt={6}>
          {ranges
            .filter((r) => options.rangeIds.includes(r.id))
            .map((r) => `${r.label}: ${r.detail}`)
            .join(' · ') || 'Chưa chọn quãng nào.'}
        </Text>

        <Switch
          mt="md"
          checked={options.accidentals}
          onChange={(e) => applyOptions({ ...options, accidentals: e.currentTarget.checked })}
          label="Có dấu hoá (phím đen)"
          description="Thêm thăng và giáng vào bài. Một phím đen viết được hai cách; ở đây dùng cách hay gặp trong giáo trình."
          data-testid="accidentals-switch"
        />

        <Text size="xs" c="dimmed" mt="md" data-testid="pool-size">
          Đang tập <b>{pool.length}</b> nốt
          {options.hands === 'both' ? ', mỗi câu đổi khóa nhạc' : ''}.
        </Text>
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
                Nốt này là nốt gì? Hãy bấm phím tương ứng trên đàn.
                {options.hands === 'both' && (
                  <> Để ý khóa nhạc — đây là <b>{current.clef === 'treble' ? 'khóa Sol' : 'khóa Pha'}</b>.</>
                )}
              </Text>

              {/* Khuông nhạc luôn để nền trắng chữ đen như bản nhạc giấy, kể cả khi trang đang ở chế độ tối. */}
              <div
                ref={paperRef}
                data-testid="staff"
                style={{
                  background: '#fff',
                  color: '#000',
                  border: '1px solid #d0d0d0',
                  borderRadius: 16,
                  padding: '0.75rem 1rem',
                  minHeight: 150,
                  width: '100%',
                  maxWidth: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />

              <Box mih={78} w="100%">
                {feedback.kind === 'correct' && (
                  <Alert color="teal" title="Chính xác" data-testid="feedback-correct">
                    Đó là <b>{current.note.name} ({current.note.scientific})</b>.
                  </Alert>
                )}
                {feedback.kind === 'wrong-octave' && (
                  <Alert color="yellow" title="Đúng tên nốt, nhưng sai quãng tám" data-testid="feedback-octave">
                    Bạn đọc đúng đây là nốt <b>{current.note.name}</b> rồi. Chỉ là tay đang đặt ở quãng khác —
                    nốt đang hỏi nằm ở <b>{current.clef === 'treble' ? 'khóa Sol, quãng của tay phải' : 'khóa Pha, quãng của tay trái'}</b> ({current.note.scientific}).
                    Cứ thử lại, không tính là sai hẳn đâu.
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
                <Button variant="default" size="md" onClick={skip}>Bỏ qua nốt này</Button>
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
