'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Alert, Badge, Box, Button, Card, Group, Progress, Select, Stack, Text,
} from '@mantine/core';
import { IconPlayerRecordFilled, IconPlayerStopFilled } from '@tabler/icons-react';
import {
  compareToScore, ComparisonResult, describePitchList, groupPlayedNotes, PlayedNote, ScoreEvent,
} from '@/lib/score-compare';
import { useMidiInput } from '@/hooks/useMidiInput';
import type { EventResult } from '@/lib/score-compare';

export function ScorePractice({
  expected,
  onResults,
}: {
  expected: ScoreEvent[];
  /** Cho khuông nhạc bên ngoài tô màu những chỗ sai. */
  onResults: (results: EventResult[] | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const notesRef = useRef<PlayedNote[]>([]);
  const startRef = useRef(0);
  const recordingRef = useRef(false);

  const handleNoteOn = useCallback((midi: number) => {
    if (!recordingRef.current) return;
    notesRef.current.push({ midi, time: performance.now() - startRef.current });
    setNoteCount(notesRef.current.length);
  }, []);

  const midi = useMidiInput(handleNoteOn);

  const start = () => {
    notesRef.current = [];
    setNoteCount(0);
    setResult(null);
    onResults(null);
    startRef.current = performance.now();
    recordingRef.current = true;
    setRecording(true);
  };

  const stop = () => {
    recordingRef.current = false;
    setRecording(false);
    const played = groupPlayedNotes(notesRef.current);
    const comparison = compareToScore(expected, played);
    setResult(comparison);
    onResults(comparison.results);
  };

  const clear = () => {
    setResult(null);
    setNoteCount(0);
    notesRef.current = [];
    onResults(null);
  };

  if (midi.status === 'unsupported') {
    return (
      <Alert color="orange" title="Trình duyệt này chưa hỗ trợ kết nối đàn" mt="md">
        Web MIDI chạy được trên Chrome, Edge, Opera và Firefox trên máy tính. Bạn vẫn nghe nhạc mẫu
        và tập bình thường được — phần ghi và chấm chỉ là hỗ trợ thêm.
      </Alert>
    );
  }

  if (midi.status === 'denied') {
    return (
      <Alert color="red" title="Chưa kết nối được đàn" mt="md">
        <Text size="sm" mb="xs">
          Trình duyệt từ chối quyền truy cập thiết bị MIDI.
          {midi.errorMessage ? ` Thông báo: ${midi.errorMessage}` : ''}
        </Text>
        <Button size="xs" onClick={midi.connect}>Thử lại</Button>
      </Alert>
    );
  }

  if (midi.status !== 'ready') {
    return (
      <Card withBorder padding="md" mt="md">
        <Group justify="space-between" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 220 }}>
            <Text fw={500}>Tập bài này với đàn</Text>
            <Text size="sm" c="dimmed">
              Cắm đàn vào máy, đánh trọn bài, rồi xem lại chỗ nào chưa đúng. Không chấm điểm trong
              lúc bạn đang đánh.
            </Text>
          </Box>
          <Button onClick={midi.connect} loading={midi.status === 'connecting'} data-testid="practice-connect">
            Kết nối đàn
          </Button>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder padding="md" mt="md" data-testid="practice-panel">
      <Group justify="space-between" align="flex-end" wrap="wrap" mb="md">
        {midi.devices.length > 1 ? (
          <Select
            label="Đàn đang dùng"
            size="xs"
            data={midi.devices.map((d) => ({ value: d.id, label: d.name }))}
            value={midi.selectedDeviceId}
            onChange={(v) => v && midi.selectDevice(v)}
            allowDeselect={false}
            w={220}
          />
        ) : (
          <Text size="sm" c="dimmed">
            Đàn: <b>{midi.devices[0]?.name ?? 'chưa thấy đàn nào'}</b>
          </Text>
        )}

        <Group gap="xs">
          {recording ? (
            <Button color="red" onClick={stop} leftSection={<IconPlayerStopFilled size={16} />} data-testid="stop-button">
              Dừng và xem lại
            </Button>
          ) : (
            <Button
              onClick={start}
              disabled={midi.devices.length === 0}
              leftSection={<IconPlayerRecordFilled size={16} />}
              data-testid="record-button"
            >
              {result ? 'Ghi lại lần nữa' : 'Bắt đầu ghi'}
            </Button>
          )}
          {result && !recording && (
            <Button variant="subtle" color="gray" onClick={clear}>Xóa kết quả</Button>
          )}
        </Group>
      </Group>

      {midi.devices.length === 0 && (
        <Alert color="yellow">Chưa thấy đàn nào. Kiểm tra dây USB và nguồn đàn — cắm vào là tự nhận.</Alert>
      )}

      {recording && (
        <Alert color="red" title="Đang ghi" data-testid="recording-alert">
          Cứ đánh theo tốc độ của bạn, chậm cũng được, dừng giữa chừng cũng được. Đã ghi{' '}
          <b data-testid="note-count">{noteCount}</b> nốt. Đánh xong thì bấm &quot;Dừng và xem lại&quot;.
        </Alert>
      )}

      {result && !recording && <ResultView result={result} />}
    </Card>
  );
}

function ResultView({ result }: { result: ComparisonResult }) {
  const { accuracy, correctCount, totalExpected, results, extras, timing } = result;
  const wrong = results.filter((r) => r.status === 'wrong');
  const missing = results.filter((r) => r.status === 'missing');

  if (totalExpected > 0 && correctCount === 0 && extras.length === 0 && missing.length === totalExpected) {
    return (
      <Alert color="gray" title="Không nhận được nốt nào" data-testid="result-empty">
        Bản ghi trống. Kiểm tra xem đã chọn đúng đàn chưa, và thử bấm vài phím xem mục &quot;phím đang
        bấm&quot; ở trang Luyện nhận nốt có phản hồi không.
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
