'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert, Badge, Box, Button, Group, Progress, Stack, Text,
} from '@mantine/core';
import { IconPlayerRecordFilled, IconPlayerStopFilled } from '@tabler/icons-react';
import {
  compareToScore, ComparisonResult, describePitchList, groupPlayedNotes, PlayedNote, ScoreEvent,
} from '@/lib/score-compare';
import { usePianoInput, type PianoInputMode } from '@/hooks/usePianoInput';
import { createFollowState, followNote } from '@/lib/score-follow';
import { pitchesForFollow } from '@/lib/mic-follow';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';
import type { EventResult } from '@/lib/score-compare';

export function ScorePractice({
  expected,
  onResults,
  onLiveMatch,
  onWrongNote,
  listenPaused = false,
}: {
  expected: ScoreEvent[];
  /** Cho khuông nhạc bên ngoài tô màu những chỗ sai sau khi bấm dừng. */
  onResults: (results: EventResult[] | null) => void;
  /**
   * Cho khuông nhạc tô xanh ngay trong lúc đánh. Nhận danh sách chỉ số sự kiện
   * đã đánh đúng, hoặc `null` để xoá hết màu.
   */
  onLiveMatch: (matchedIndexes: number[] | null) => void;
  /**
   * Báo vừa có một nốt bấm không khớp vào đâu, kèm chỉ số nốt đang chờ để khuông
   * nhạc nháy đỏ chỗ đó. Nháy rồi tắt, không ghi lại thành vết.
   */
  onWrongNote: (expectedIndex: number) => void;
  /**
   * Bật khi app đang tự phát bản nhạc mẫu. Micro sẽ nghe thấy chính cái loa của
   * máy và tưởng người học đang đánh — nên trong lúc đó bỏ qua mọi thứ micro nghe.
   */
  listenPaused?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  /** Con trỏ bám theo, giữ trong state để micro biết phím nào đang được chờ. */
  const [cursor, setCursor] = useState(0);

  const notesRef = useRef<PlayedNote[]>([]);
  const startRef = useRef(0);
  const recordingRef = useRef(false);
  const followRef = useRef(createFollowState());

  const handleNoteOn = useCallback((midi: number, atMs: number = performance.now()) => {
    if (!recordingRef.current) return;
    notesRef.current.push({ midi, time: atMs - startRef.current });
    setNoteCount(notesRef.current.length);

    // Bám theo người học: tô xanh chỗ vừa đánh đúng, nháy đỏ chỗ đang chờ khi
    // đánh trượt. Việc chấm đầy đủ vẫn nằm ở stop().
    const previous = followRef.current;
    const next = followNote(expected, previous, midi);
    if (next === previous) return;
    followRef.current = next;
    setCursor(next.cursor);

    if (next.matched.length > previous.matched.length) {
      setMatchedCount(next.matched.length);
      onLiveMatch(next.matched);
    }
    // Lấy con trỏ TRƯỚC khi bấm: đó mới là nốt người học đáng lẽ phải đánh.
    if (next.misses > previous.misses) onWrongNote(previous.cursor);
  }, [expected, onLiveMatch, onWrongNote]);

  /**
   * Cài đặt cho micro, suy từ bản nhạc: chỉ nghe trong tầm phím bài này dùng (nới
   * mỗi bên một quãng tám cho nốt đánh sai), và báo trước phím đang chờ để nốt nhẹ
   * trong hợp âm không bị lọt (xem `DetectOptions.hint`).
   */
  const micRange = useMemo<readonly [number, number] | undefined>(() => {
    const all = expected.flatMap((e) => e.pitches);
    if (all.length === 0) return undefined;
    return [Math.max(36, Math.min(...all) - 12), Math.min(96, Math.max(...all) + 12)];
  }, [expected]);
  const micMaxNotes = useMemo(() => Math.min(5, Math.max(1, ...expected.map((e) => e.pitches.length)) + 1), [expected]);
  const micHint = useMemo(
    () => [...(expected[cursor]?.pitches ?? []), ...(expected[cursor + 1]?.pitches ?? [])],
    [expected, cursor],
  );

  const input = usePianoInput(
    {
      onMidiNote: (midi) => handleNoteOn(midi),
      onMicHeard: (event, atMs) => {
        // Chọn và xếp thứ tự trước khi đưa vào bám theo: nốt khớp chỗ đang chờ đi
        // trước, nốt lạ yếu bỏ đi — xem mic-follow.ts.
        for (const pitch of pitchesForFollow(event.notes, expected, followRef.current.cursor)) {
          handleNoteOn(pitch, atMs);
        }
      },
    },
    { hint: micHint, range: micRange, maxNotes: micMaxNotes, paused: listenPaused },
  );

  const start = () => {
    notesRef.current = [];
    followRef.current = createFollowState();
    setCursor(0);
    setNoteCount(0);
    setMatchedCount(0);
    setResult(null);
    onResults(null);
    onLiveMatch([]);
    startRef.current = performance.now();
    recordingRef.current = true;
    setRecording(true);
  };

  const stop = () => {
    recordingRef.current = false;
    setRecording(false);
    // Xoá màu xanh của lúc đang đánh trước khi tô bảng chấm đầy đủ, để hai lớp
    // màu không chồng lên nhau.
    onLiveMatch(null);
    const played = groupPlayedNotes(notesRef.current);
    const comparison = compareToScore(expected, played);
    setResult(comparison);
    onResults(comparison.results);
  };

  const clear = () => {
    setResult(null);
    setNoteCount(0);
    setMatchedCount(0);
    notesRef.current = [];
    followRef.current = createFollowState();
    setCursor(0);
    onResults(null);
    onLiveMatch(null);
  };

  if (!input.mode) {
    return (
      <Box mt="md">
        <PianoInputChooser
          input={input}
          title="Tập bài này với đàn"
          description={(
            <>
              Đánh trên đàn thật, app nghe và tô xanh ngay trên khuông nhạc nốt nào đúng; đánh trượt
              thì nốt đang chờ nháy đỏ một cái để bạn biết mình đang ở đâu. Không đếm giờ, không trừ
              điểm — cứ đánh lại tới khi được. Đánh xong bấm dừng để xem lại toàn bài.
            </>
          )}
        />
      </Box>
    );
  }

  return (
    <Stack gap="sm" mt="md" data-testid="practice-panel">
      <PianoInputStatus input={input} />

      {/* Nút dừng luôn phải còn khi đang ghi, kể cả lúc micro vừa rớt hay dây vừa tuột —
          thiếu nó thì người học kẹt lại trong trạng thái đang ghi, không có đường ra. */}
      {(input.ready || recording) && (
        <Group gap="xs">
          {recording ? (
            <Button color="red" onClick={stop} leftSection={<IconPlayerStopFilled size={16} />} data-testid="stop-button">
              Dừng và xem lại
            </Button>
          ) : (
            <Button onClick={start} leftSection={<IconPlayerRecordFilled size={16} />} data-testid="record-button">
              {result ? 'Ghi lại lần nữa' : 'Bắt đầu ghi'}
            </Button>
          )}
          {result && !recording && (
            <Button variant="subtle" color="gray" onClick={clear}>Xóa kết quả</Button>
          )}
        </Group>
      )}

      {recording && (
        <Alert color="red" title="Đang ghi" data-testid="recording-alert">
          Cứ đánh theo tốc độ của bạn, chậm cũng được, dừng giữa chừng cũng được. Đã ghi{' '}
          <b data-testid="note-count">{noteCount}</b> nốt, xanh được{' '}
          <b data-testid="matched-count">{matchedCount}</b>/{expected.length} chỗ trên khuông. Đánh
          xong thì bấm &quot;Dừng và xem lại&quot;.
        </Alert>
      )}

      {result && !recording && <ResultView result={result} mode={input.mode} />}
    </Stack>
  );
}

function ResultView({ result, mode }: { result: ComparisonResult; mode: PianoInputMode }) {
  const { accuracy, correctCount, totalExpected, results, extras, timing } = result;
  const wrong = results.filter((r) => r.status === 'wrong');
  const missing = results.filter((r) => r.status === 'missing');

  if (totalExpected > 0 && correctCount === 0 && extras.length === 0 && missing.length === totalExpected) {
    return (
      <Alert color="gray" title="Không nhận được nốt nào" data-testid="result-empty">
        {mode === 'mic'
          ? 'Bản ghi trống. Nhìn thanh mức âm ở trên khi bạn đánh: thanh không nhúc nhích thì micro không thu được gì — đặt máy gần đàn hơn, hoặc vặn to đàn điện lên.'
          : 'Bản ghi trống. Kiểm tra xem đã chọn đúng đàn chưa, và thử bấm vài phím xem mục "Phím đang bấm" ở trên có phản hồi không.'}
      </Alert>
    );
  }

  const tone = accuracy >= 90 ? 'teal' : accuracy >= 60 ? 'yellow' : 'orange';

  return (
    <Stack gap="sm" data-testid="result-view">
      <Group justify="space-between">
        <Text fw={500}>Kết quả</Text>
        <Badge color={tone} variant="light" size="lg" data-testid="result-accuracy">
          {correctCount}/{totalExpected} nốt đúng ({accuracy}%)
        </Badge>
      </Group>
      <Progress value={accuracy} color={tone} />

      <Text size="sm" c="dimmed">
        Những nốt sai được tô cam, nốt bỏ sót tô xám ngay trên khuông nhạc ở trên.
      </Text>

      {wrong.length > 0 && (
        <Box>
          <Text size="sm" fw={500}>Đánh sai ({wrong.length})</Text>
          {wrong.slice(0, 6).map((r) => (
            <Text key={r.expectedIndex} size="sm" c="dimmed">
              • Ô nhịp {(r.measureNumber ?? 0) + 1}: cần <b>{describePitchList(r.expectedPitches)}</b>,
              bạn đánh <b>{describePitchList(r.playedPitches)}</b>
            </Text>
          ))}
          {wrong.length > 6 && <Text size="xs" c="dimmed">…và {wrong.length - 6} chỗ nữa.</Text>}
        </Box>
      )}

      {missing.length > 0 && (
        <Text size="sm" c="dimmed">
          <b>Bỏ sót {missing.length} nốt</b>
          {missing.length > totalExpected / 2
            ? ' — nhiều khả năng bạn dừng giữa chừng, hoặc bản ghi bắt đầu muộn hơn lúc bạn đánh.'
            : '.'}
        </Text>
      )}

      {extras.length > 0 && (
        <Text size="sm" c="dimmed">
          <b>Thừa {extras.length} nốt</b> không có trong bài. Thường là đánh nhầm phím bên cạnh rồi
          đánh lại — không sao cả.
        </Text>
      )}

      {timing.measurable ? (
        <Box>
          <Text size="sm" fw={500}>Nhịp</Text>
          <Text size="sm" c="dimmed">
            Bạn chơi ở khoảng <b>{Math.round(100 / (timing.tempoRatio ?? 1))}%</b> tốc độ ghi trong bài.
            {timing.tempoRatio && timing.tempoRatio > 1.15
              && ' Chậm hơn bản gốc — hoàn toàn bình thường khi đang tập, đừng vội tăng tốc.'}
            {timing.tempoRatio && timing.tempoRatio < 0.85
              && ' Nhanh hơn bản gốc. Nếu chưa thật chắc tay thì nên chậm lại, đánh đúng ở tốc độ chậm giá trị hơn nhiều.'}
          </Text>
          <Text size="sm" c="dimmed">
            {timing.offBeatCount === 0
              ? 'Nhịp của bạn đều so với chính mình. Đây mới là điều quan trọng.'
              : `Có ${timing.offBeatCount} chỗ nhanh chậm thất thường so với tốc độ chung của chính bạn. Thường là đoạn khó bị chậm lại — hãy tách riêng đoạn đó ra tập.`}
          </Text>
        </Box>
      ) : (
        <Text size="sm" c="dimmed">
          Chưa đủ nốt để nói gì về nhịp. Cần đánh trọn vẹn hơn một chút.
        </Text>
      )}

      <Alert color="blue" variant="light">
        <Text size="sm">
          Con số này để bạn biết nên tập lại chỗ nào, không phải để tự chấm điểm mình. Đúng 60% mà
          biết rõ ba chỗ cần sửa thì tốt hơn đúng 90% mà không biết vì sao.
        </Text>
      </Alert>
    </Stack>
  );
}
