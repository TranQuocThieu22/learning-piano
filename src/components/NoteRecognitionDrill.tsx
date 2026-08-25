'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import {
  Alert, Badge, Box, Button, Card, Group, Progress, SegmentedControl, Select, Stack, Text,
} from '@mantine/core';
import {
  checkAnswer, describeMidiNote, DRILL_LEVELS, DrillNote, findLevel, pickNextNote, singleNoteAbc,
} from '@/lib/midi-notes';
import { useMidiInput } from '@/hooks/useMidiInput';

/** Thời gian dừng lại sau khi bấm đúng, đủ để nhìn thấy phản hồi rồi mới sang nốt mới. */
const ADVANCE_DELAY_MS = 900;

type Feedback =
  | { kind: 'none' }
  | { kind: 'correct' }
  | { kind: 'wrong-octave'; played: number }
  | { kind: 'wrong'; played: number };

/**
/**
 * Nhãn của thanh chọn phạm vi dài hơn một phần ba bề ngang máy điện thoại, nên
 * buộc phải cho nó xuống dòng. Thả cho trình duyệt tự chọn chỗ ngắt thì ra
 * "Khóa Sol (tay" / "phải)" trông rất kỳ, vì vậy bọc mỗi cụm vào một span cấm
 * ngắt — chỗ ngắt duy nhất còn lại là khoảng trắng giữa hai cụm.
 *
 * Quy tắc thu chữ khi màn hình hẹp nằm ở `.drill-level-picker` trong globals.css.
 */
function levelLabel(label: string) {
  const at = label.indexOf(' (');
  if (at < 0) return label;
  return (
    <>
      <span style={{ whiteSpace: 'nowrap' }}>{label.slice(0, at)}</span>{' '}
      <span style={{ whiteSpace: 'nowrap' }}>{label.slice(at + 1)}</span>
    </>
  );
}

export function NoteRecognitionDrill() {
  const [levelId, setLevelId] = useState(DRILL_LEVELS[0].id);
  const level = useMemo(() => findLevel(levelId), [levelId]);

  const [current, setCurrent] = useState<DrillNote>(() => pickNextNote(findLevel(DRILL_LEVELS[0].id).notes, null));
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

  const advance = useCallback((notes: DrillNote[], previous: DrillNote | null) => {
    lockedRef.current = false;
    missedCurrentRef.current = false;
    setFeedback({ kind: 'none' });
    setCurrent(pickNextNote(notes, previous));
  }, []);

  const handleNoteOn = (played: number) => {
    if (lockedRef.current) return;
    const verdict = checkAnswer(played, current.midi);

    if (verdict === 'correct') {
      lockedRef.current = true;
      setFeedback({ kind: 'correct' });
      setAnswered((n) => n + 1);
      if (!missedCurrentRef.current) setFirstTryCorrect((n) => n + 1);
      timerRef.current = setTimeout(() => advance(level.notes, current), ADVANCE_DELAY_MS);
      return;
    }

    if (!missedCurrentRef.current) {
      missedCurrentRef.current = true;
      setMistakes((m) => ({ ...m, [current.midi]: (m[current.midi] ?? 0) + 1 }));
    }
    setFeedback(verdict === 'wrong-octave' ? { kind: 'wrong-octave', played } : { kind: 'wrong', played });
  };

  const midi = useMidiInput(handleNoteOn);

  // Vẽ lại khuông nhạc mỗi khi đổi nốt hoặc đổi khóa nhạc.
  useEffect(() => {
    if (!paperRef.current) return;
    ABCJS.renderAbc(paperRef.current, singleNoteAbc(current, level.clef), {
      staffwidth: 220,
      scale: 2,
      paddingtop: 8,
      paddingbottom: 8,
      paddingleft: 0,
      paddingright: 0,
    });
  }, [current, level.clef]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const changeLevel = (id: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = findLevel(id);
    setLevelId(id);
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
    advance(next.notes, null);
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance(level.notes, current);
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnswered(0);
    setFirstTryCorrect(0);
    setMistakes({});
    advance(level.notes, current);
  };

  const accuracy = answered > 0 ? Math.round((firstTryCorrect / answered) * 100) : 0;
  const worstNotes = Object.entries(mistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, count]) => {
      const note = level.notes.find((n) => n.midi === Number(m));
      return { label: note ? `${note.name} (${note.scientific})` : describeMidiNote(Number(m)), count };
    });

  return (
    <Stack gap="lg">
      <Box>
        <Text size="sm" fw={500} mb={6}>Chọn phạm vi nốt</Text>
        <SegmentedControl
          className="drill-level-picker"
          fullWidth
          value={levelId}
          onChange={changeLevel}
          data={DRILL_LEVELS.map((l) => ({ value: l.id, label: levelLabel(l.label) }))}
        />
        <Text size="xs" c="dimmed" mt={6}>{level.hint}</Text>
      </Box>

      <MidiPanel midi={midi} />

      <Card withBorder padding="lg" data-testid="drill-card">
        <Stack align="center" gap="md">
          <Text size="sm" c="dimmed">Nốt này là nốt gì? Hãy bấm phím tương ứng trên đàn.</Text>

          {/* Khuông nhạc luôn để nền trắng chữ đen như bản nhạc giấy, kể cả khi trang đang ở chế độ tối. */}
          <div
            ref={paperRef}
            data-testid="staff"
            style={{
              background: '#fff',
              color: '#000',
              border: '1px solid #d0d0d0',
              borderRadius: 8,
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
                Đó là <b>{current.name} ({current.scientific})</b>.
              </Alert>
            )}
            {feedback.kind === 'wrong-octave' && (
              <Alert color="yellow" title="Đúng tên nốt, nhưng sai quãng tám" data-testid="feedback-octave">
                Bạn đọc đúng đây là nốt <b>{current.name}</b> rồi. Chỉ là tay đang đặt ở quãng khác —
                nốt đang hỏi nằm ở <b>{level.clef === 'treble' ? 'khóa Sol, quãng của tay phải' : 'khóa Pha, quãng của tay trái'}</b> ({current.scientific}).
                Cứ thử lại, không tính là sai hẳn đâu.
              </Alert>
            )}
            {feedback.kind === 'wrong' && (
              <Alert color="orange" title="Chưa đúng" data-testid="feedback-wrong">
                Bạn vừa bấm <b>{describeMidiNote(feedback.played)}</b>. Cứ từ từ đếm dòng và khe trên khuông
                nhạc rồi thử lại — không có giới hạn thời gian nào cả.
              </Alert>
            )}
          </Box>

          <Group>
            <Button variant="default" onClick={skip}>Bỏ qua nốt này</Button>
            <Button variant="subtle" color="gray" onClick={restart}>Làm lại từ đầu</Button>
          </Group>
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

function MidiPanel({ midi }: { midi: ReturnType<typeof useMidiInput> }) {
  const { status, errorMessage, devices, selectedDeviceId, selectDevice, connect, heldNotes } = midi;

  if (status === 'unsupported') {
    return (
      <Alert color="orange" title="Trình duyệt này chưa hỗ trợ kết nối đàn">
        Web MIDI hiện chạy được trên Chrome, Edge, Opera và Firefox trên máy tính. Safari và các trình
        duyệt trên iPhone/iPad thì chưa. Bạn vẫn học bình thường được — bài luyện nhận nốt chỉ là
        công cụ hỗ trợ thêm, không bắt buộc.
      </Alert>
    );
  }

  if (status === 'denied') {
    return (
      <Alert color="red" title="Chưa kết nối được">
        <Text size="sm" mb="xs">
          Trình duyệt từ chối quyền truy cập thiết bị MIDI. Thường là do bạn bấm &quot;Chặn&quot; ở hộp thoại
          xin quyền, hoặc trang đang mở bằng http thay vì https.
          {errorMessage ? ` Thông báo từ trình duyệt: ${errorMessage}` : ''}
        </Text>
        <Button size="xs" onClick={connect}>Thử lại</Button>
      </Alert>
    );
  }

  if (status !== 'ready') {
    return (
      <Card withBorder padding="md">
        <Group justify="space-between" wrap="wrap">
          <Box>
            <Text fw={500}>Kết nối đàn</Text>
            <Text size="sm" c="dimmed">
              Cắm dây USB từ đàn vào máy tính, rồi bấm nút bên cạnh. Trình duyệt sẽ hỏi quyền một lần.
            </Text>
          </Box>
          <Button onClick={connect} loading={status === 'connecting'} data-testid="connect-button">
            Kết nối đàn
          </Button>
        </Group>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Alert color="yellow" title="Đã bật Web MIDI nhưng chưa thấy đàn nào">
        Kiểm tra lại dây USB và bật nguồn đàn. Cắm vào là danh sách tự cập nhật, không cần tải lại trang.
      </Alert>
    );
  }

  return (
    <Card withBorder padding="md" data-testid="midi-ready">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Select
          label="Đàn đang dùng"
          data={devices.map((d) => ({ value: d.id, label: d.name }))}
          value={selectedDeviceId}
          onChange={(v) => v && selectDevice(v)}
          allowDeselect={false}
          w={260}
        />
        <Box>
          <Text size="sm" c="dimmed">Phím đang bấm</Text>
          <Text fw={500} data-testid="held-notes">
            {heldNotes.length === 0 ? '—' : heldNotes.map(describeMidiNote).join(', ')}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}
