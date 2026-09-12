'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Badge, Box, Button, Card, Chip, Group, Progress, Stack, Text,
} from '@mantine/core';
import { IconEar, IconPlayerPlayFilled } from '@tabler/icons-react';
import {
  DEFAULT_EAR_OPTIONS, EAR_PRESETS, earNotePool, earPresetOf, judgeEar, NEAR_SEMITONES,
  pickEarQuestion, REFERENCE_MIDI, type EarOptions,
} from '@/lib/ear-training';
import { describeMidiNote, noteAt } from '@/lib/midi-notes';
import { holdAmbient } from '@/lib/ambient-hold';
import { usePhrasePlayer } from '@/hooks/usePhrasePlayer';
import { usePianoInput } from '@/hooks/usePianoInput';
import { createLocalStore } from '@/lib/local-store';
import { useLocalStore } from '@/hooks/useLocalStore';
import { answersFromHeard } from '@/lib/mic-follow';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';

const STORAGE_KEY = 'ear-trainer-options';

/** Nghỉ giữa hai nốt của một câu, tính bằng phần của một nốt đen. */
const NOTE_GAP = ' ';

/** Dừng lại sau khi trúng, đủ để đọc tên nốt rồi mới sang câu mới. */
const ADVANCE_DELAY_MS = 1400;

/**
 * Kho nhớ lựa chọn.
 *
 * **Chỉ lưu MÃ MỨC, không lưu cả bộ lựa chọn.** Bài này chưa có đường tự chỉnh
 * từng thứ, nên lưu cả bộ là mời gọi một trạng thái không mức nào nhận — và lúc
 * đó bảng mức không biết tô đậm cái nào. Lưu mã thì sửa một mức về sau là mọi
 * người đang ở mức đó được hưởng ngay.
 *
 * Vì thế thứ ĐỌC RA là cả bộ lựa chọn còn thứ GHI XUỐNG là mã mức — đúng chỗ
 * `serialize` sinh ra để làm.
 */
const optionsStore = createLocalStore<EarOptions>({
  key: STORAGE_KEY,
  fallback: DEFAULT_EAR_OPTIONS,
  parse: (raw) => {
    const saved = JSON.parse(raw) as { presetId?: string };
    const found = EAR_PRESETS.find((p) => p.id === saved.presetId);
    return found ? found.options : DEFAULT_EAR_OPTIONS;
  },
  serialize: (options) => JSON.stringify({ presetId: earPresetOf(options)?.id }),
});

/** Người học bấm một mức: đổi cả bộ lựa chọn sang mức đó. Mã lạ thì bỏ qua. */
function chooseEarPreset(presetId: string) {
  const found = EAR_PRESETS.find((p) => p.id === presetId);
  if (found) optionsStore.save(found.options);
}

type Feedback =
  | { kind: 'none' }
  | { kind: 'correct'; notes: number[] }
  /** Một nốt trong câu đã trúng, còn nốt sau. */
  | { kind: 'partial' }
  | { kind: 'wrong'; played: number; direction: 'higher' | 'lower'; sameNoteName: boolean; distance: number };

/** Dựng đoạn ABC phát ra tiếng: các nốt nối tiếp nhau, có hoặc không có nốt mốc. */
function questionAbc(notes: number[], withReference: boolean): string {
  const body = notes.map((m) => noteAt(m).abc).join(NOTE_GAP);
  /*
   * Nốt mốc tách hẳn bằng một dấu lặng, để tai nghe ra "đây là mốc, còn kia là
   * câu hỏi" chứ không nghe thành một câu ba nốt.
   */
  const head = withReference ? `${noteAt(REFERENCE_MIDI).abc} z ` : '';
  return ['X:1', 'L:1/2', 'M:none', 'K:C', `${head}${body}`].join('\n');
}

export function EarTrainingDrill() {
  const options = useLocalStore(optionsStore);
  const preset = earPresetOf(options) ?? EAR_PRESETS[0];
  const pool = useMemo(() => earNotePool(options), [options]);

  const [question, setQuestion] = useState<number[] | null>(
    () => pickEarQuestion(DEFAULT_EAR_OPTIONS, null)
  );
  /** Nốt đang phải mò. Con trỏ chỉ nhích khi bấm trúng — không đếm giờ. */
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'none' });
  const [answered, setAnswered] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [tries, setTries] = useState(0);
  const { sinkRef, playing, play: playPhrase } = usePhrasePlayer();
  /**
   * Câu đang hỏi đã được phát lần nào chưa.
   *
   * Chỉ để chọn chữ trên nút: lần đầu là *Nghe câu này*, sau đó mới là *Nghe
   * lại*. Nghe có vẻ vụn vặt, nhưng một cái nút ghi "Nghe lại" khi người học
   * chưa nghe gì bao giờ là nút nói dối — và nó làm người mới tưởng mình vừa bỏ
   * lỡ mất âm thanh nào đó.
   */
  const [heardOnce, setHeardOnce] = useState(false);

  const lockedRef = useRef(false);
  const missedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Đổi mức thì bốc câu mới và xoá thống kê, ngay trong lúc vẽ — cách React
     khuyến nghị để đặt lại state khi đầu vào đổi. */
  const [shownFor, setShownFor] = useState(options);
  if (shownFor !== options) {
    setShownFor(options);
    setQuestion(pickEarQuestion(options, null));
    setIndex(0);
    setHeardOnce(false);
    setFeedback({ kind: 'none' });
    setAnswered(0);
    setFirstTryCorrect(0);
    setTries(0);
  }

  /** Nhạc nền im trong lúc phát câu hỏi — cùng luật với bản nhạc mẫu ở bài học. */
  useEffect(() => {
    if (!playing) return;
    return holdAmbient();
  }, [playing]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /**
   * Phát câu hỏi. Phần máy móc nằm ở `usePhrasePlayer`; ở đây chỉ dựng chuỗi ABC
   * và nhớ là người học đã nghe câu này ít nhất một lần.
   */
  const playQuestion = useCallback(async (notes: number[], withReference: boolean) => {
    // Chỉ đổi chữ trên nút khi thật sự đã kêu: trình duyệt chặn tiếng thì nút
    // vẫn phải ghi *Nghe câu này*, xem chú thích ở `heardOnce`.
    if (await playPhrase(questionAbc(notes, withReference))) setHeardOnce(true);
  }, [playPhrase]);

  const advance = useCallback((previous: number[] | null, forOptions: EarOptions) => {
    lockedRef.current = false;
    missedRef.current = false;
    indexRef.current = 0;
    setIndex(0);
    setFeedback({ kind: 'none' });
    setHeardOnce(false);
    const next = pickEarQuestion(forOptions, previous);
    setQuestion(next);
    if (next) void playQuestion(next, forOptions.reference);
  }, [playQuestion]);

  /**
   * Nhận một phím vừa bấm.
   *
   * Bấm trượt chỉ đổi lấy **một lời chỉ đường**: cao hơn hay thấp hơn. Không trừ
   * gì, không lùi con trỏ, không hiện bảng tỉ số — đúng bốn luật chống áp lực.
   */
  const handleNoteOn = (played: number) => {
    if (lockedRef.current || !question) return;
    const target = question[indexRef.current];
    if (target === undefined) return;

    const verdict = judgeEar(target, played);
    setTries((n) => n + 1);

    if (!verdict.correct) {
      missedRef.current = true;
      setFeedback({
        kind: 'wrong',
        played,
        direction: verdict.direction!,
        sameNoteName: verdict.sameNoteName,
        distance: verdict.distance,
      });
      return;
    }

    const conNua = indexRef.current + 1 < question.length;
    if (conNua) {
      indexRef.current += 1;
      setIndex(indexRef.current);
      setFeedback({ kind: 'partial' });
      return;
    }

    lockedRef.current = true;
    setFeedback({ kind: 'correct', notes: question });
    setAnswered((n) => n + 1);
    if (!missedRef.current) setFirstTryCorrect((n) => n + 1);
    timerRef.current = setTimeout(() => advance(question, options), ADVANCE_DELAY_MS);
  };

  const notesConThieu = question ? question.slice(index) : [];

  // Micro chỉ nghe trong tầm đang tập, nới mỗi bên một quãng tám để vẫn bắt được
  // khi người học mò sang quãng khác.
  const micRange = useMemo<[number, number]>(() => {
    if (pool.length === 0) return [48, 72];
    return [Math.min(...pool) - 12, Math.max(...pool) + 12];
  }, [pool]);

  const input = usePianoInput(
    {
      onMidiNote: handleNoteOn,
      onMicHeard: (event) => {
        if (!question) return;
        /*
         * KHÔNG mách micro nốt đang cần tìm — khác hẳn bài luyện nhận nốt.
         *
         * Ở đó nốt đang hỏi hiện sẵn trên màn hình nên gợi ý chỉ giúp nghe rõ
         * hơn. Ở đây nốt đang hỏi là **bí mật**: mách vào là micro thiên vị đúng
         * cái nốt người học chưa tìm ra, và lời chỉ đường "cao hơn / thấp hơn"
         * sẽ chỉ sai — thứ tệ hơn cả không có lời chỉ đường nào.
         */
        for (const midi of answersFromHeard(event.notes, [])) handleNoteOn(midi);
      },
    },
    { range: micRange, maxNotes: 2 }
  );

  const replay = () => {
    if (question) void playQuestion(question, options.reference);
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance(question, options);
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnswered(0);
    setFirstTryCorrect(0);
    setTries(0);
    advance(question, options);
  };

  const accuracy = answered > 0 ? Math.round((firstTryCorrect / answered) * 100) : 0;

  return (
    <Stack gap="lg">
      <div ref={sinkRef} style={{ display: 'none' }} aria-hidden />

      <Card withBorder padding="md" data-testid="ear-options">
        <Text size="sm" fw={500} mb={6}>Mức độ</Text>
        <Chip.Group
          multiple={false}
          value={preset.id}
          onChange={(value) => typeof value === 'string' && chooseEarPreset(value)}
        >
          <Group gap={6}>
            {EAR_PRESETS.map((p) => (
              <Chip key={p.id} value={p.id} size="sm" data-testid={`ear-preset-${p.id}`}>
                {p.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Text size="xs" c="dimmed" mt={6} data-testid="ear-hint">
          {preset.hint}
        </Text>
      </Card>

      {input.mode ? (
        <PianoInputStatus input={input} />
      ) : (
        <PianoInputChooser
          input={input}
          title="Để app nghe bạn mò"
          description="Chọn một cách để app biết bạn vừa bấm phím nào trên đàn thật."
        />
      )}

      <Card withBorder padding="lg" data-testid="ear-card">
        <Stack align="center" gap="md">
          {question ? (
            <>
              <Text size="sm" c="dimmed" ta="center">
                {question.length > 1 && (
                  <><b>Nốt thứ {index + 1} trên {question.length}</b>. </>
                )}
                Bấm thử trên đàn cho tới khi trúng — app sẽ nói bạn đang cao hơn hay thấp hơn.
              </Text>

              {/*
                Nút NGHE LẠI to nhất màn hình và không có giới hạn số lần.
                Nghe lại không phải là gian lận: tai chỉ nhớ được âm thanh khi đã
                gặp nó đủ nhiều lần, và người không dám nghe lại là người bỏ cuộc.
              */}
              <Button
                size="xl"
                fullWidth
                leftSection={<IconPlayerPlayFilled size={22} />}
                onClick={replay}
                loading={playing}
                data-testid="ear-replay"
              >
                {heardOnce ? 'Nghe lại' : 'Nghe câu này'}
              </Button>

              <Box mih={96} w="100%">
                {feedback.kind === 'partial' && (
                  <Alert color="teal" variant="light" title="Trúng rồi, còn nốt nữa" data-testid="ear-partial">
                    Giữ cảm giác đó trong đầu rồi mò tiếp nốt sau.
                  </Alert>
                )}
                {feedback.kind === 'correct' && (
                  <Alert color="teal" title="Chính xác" data-testid="ear-correct">
                    {/* Tên nốt chỉ hiện SAU khi trúng. Hiện lúc đang mò là làm hộ
                        đúng phần cần rèn. */}
                    Câu này là{' '}
                    {feedback.notes.map((m, i) => (
                      <span key={`${m}-${i}`}>
                        {i > 0 && ' → '}
                        <b>{describeMidiNote(m)}</b>
                      </span>
                    ))}.
                  </Alert>
                )}
                {feedback.kind === 'wrong' && (
                  <Alert
                    color={feedback.distance <= NEAR_SEMITONES ? 'yellow' : 'blue'}
                    variant="light"
                    title={feedback.direction === 'higher' ? 'Nốt cần tìm CAO hơn' : 'Nốt cần tìm THẤP hơn'}
                    data-testid="ear-wrong"
                  >
                    {input.mode === 'mic' ? 'Máy nghe thấy ' : 'Bạn vừa bấm '}
                    <b>{describeMidiNote(feedback.played)}</b>.{' '}
                    {feedback.sameNoteName
                      ? 'Đúng tên nốt rồi, chỉ là khác quãng tám — đi cùng hướng một quãng tám nữa.'
                      : feedback.distance <= NEAR_SEMITONES
                        ? 'Gần lắm rồi, nhích một hai phím nữa thôi.'
                        : 'Cứ đi từng bước về hướng đó, nghe lại bao nhiêu lần cũng được.'}
                  </Alert>
                )}
              </Box>

              <Group justify="center">
                <Button variant="default" size="md" onClick={skip} data-testid="ear-skip">
                  {notesConThieu.length > 1 ? 'Bỏ qua câu này' : 'Bỏ qua nốt này'}
                </Button>
                <Button variant="subtle" color="gray" size="md" onClick={restart}>
                  Làm lại từ đầu
                </Button>
              </Group>
            </>
          ) : (
            <Alert color="gray" title="Chưa có nốt nào để hỏi" w="100%">
              Chọn một mức ở trên thì bài luyện mới bắt đầu được.
            </Alert>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Group justify="space-between" mb="xs">
          <Text fw={500}>Kết quả buổi luyện</Text>
          <Badge variant="light" data-testid="ear-answered">{answered} câu đã mò ra</Badge>
        </Group>
        <Text size="sm" c="dimmed" mb={6}>
          Trúng ngay lần đầu: <b>{firstTryCorrect}/{answered}</b>
          {answered > 0 ? ` (${accuracy}%)` : ''}
        </Text>
        <Progress value={accuracy} color={accuracy >= 60 ? 'teal' : accuracy >= 30 ? 'yellow' : 'orange'} />
        {/*
          Số lần bấm KHÔNG phải điểm trừ, và nói thẳng điều đó ra. Mò nhiều lần
          là cách bài này hoạt động; ai đọc con số này như một cái lỗi sẽ thôi
          không dám mò nữa, mà thôi mò là thôi học.
        */}
        <Text size="xs" c="dimmed" mt={8}>
          Đã bấm thử <b>{tries}</b> lần. Con số này không phải điểm trừ — mò ra được nốt
          bằng cách thử nhiều lần vẫn là mò ra được, và tai nhớ nhờ những lần thử ấy.
        </Text>
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <IconEar size={20} />
            <Text fw={600}>Tập sao cho có ích</Text>
          </Group>
          <Text size="sm">
            <b>Hát theo trước khi bấm.</b> Nghe xong, ngân nhẹ nốt đó bằng miệng rồi mới đi tìm
            trên đàn. Tai và giọng nối với nhau nhanh hơn tai và ngón tay nhiều.
          </Text>
          <Text size="sm">
            <b>Đi từng bước, đừng nhảy.</b> Bấm một phím, nghe app nói cao hơn hay thấp hơn, rồi
            nhích một phím về hướng đó. Cách này chậm hơn đoán bừa nhưng nó dạy tai bạn quãng
            cách nghe ra sao — mà đó mới là thứ dùng được khi mò một bài hát thật.
          </Text>
          <Text size="sm">
            <b>Năm phút mỗi ngày hơn một tiếng mỗi tuần.</b> Tai quen dần chứ không quen đột ngột.
          </Text>
          <Text size="sm">
            <b>Chưa mò ra cũng không sao.</b> Bấm <i>Bỏ qua</i> rồi đi tiếp. Câu bỏ qua không tính
            là sai, và nốt đó sẽ quay lại ở lần sau.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
