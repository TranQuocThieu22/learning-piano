'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import {
  Alert, Badge, Box, Button, Card, Group, Progress, SegmentedControl, Stack, Text,
} from '@mantine/core';
import {
  checkAnswer, describeMidiNote, DRILL_LEVELS, DrillNote, findLevel, pickNextNote, singleNoteAbc,
} from '@/lib/midi-notes';
import { usePianoInput } from '@/hooks/usePianoInput';
import { answerFromHeard } from '@/lib/mic-follow';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';

/** Thời gian dừng lại sau khi bấm đúng, đủ để nhìn thấy phản hồi rồi mới sang nốt mới. */
const ADVANCE_DELAY_MS = 900;

type Feedback =
  | { kind: 'none' }
  | { kind: 'correct' }
  | { kind: 'wrong-octave'; played: number }
  | { kind: 'wrong'; played: number };

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

  // Micro chỉ nghe trong tầm của mức đang chọn, nới mỗi bên một quãng tám để vẫn
  // bắt được khi người học đặt nhầm tay sang quãng khác (thành câu "sai quãng tám").
  const levelMidis = level.notes.map((n) => n.midi);
  const micRange: [number, number] = [Math.min(...levelMidis) - 12, Math.max(...levelMidis) + 12];

  const input = usePianoInput(
    {
      onMidiNote: handleNoteOn,
      onMicHeard: (event) => {
        const answer = answerFromHeard(event.notes, current.midi);
        if (answer !== null) handleNoteOn(answer);
      },
    },
    // Báo trước nốt đang hỏi: đã kiểm trên hàng chục lần trả lời sai rằng gợi ý này
    // không bao giờ biến một lần đánh sai thành "Chính xác" (mic-accuracy.test.ts).
    { hint: [current.midi], range: micRange, maxNotes: 2 },
  );

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
                {/* Với micro thì nói "máy nghe thấy", không nói "bạn vừa bấm": micro có thể
                    nghe nhầm, và người học đánh đúng mà bị bảo là bấm sai thì mất lòng tin. */}
                {input.mode === 'mic' ? 'Máy nghe thấy' : 'Bạn vừa bấm'} <b>{describeMidiNote(feedback.played)}</b>.
                Cứ từ từ đếm dòng và khe trên khuông nhạc rồi thử lại — không có giới hạn thời gian nào cả.
                {input.mode === 'mic' && ' Nếu chắc mình đánh đúng thì có thể máy nghe nhầm: đánh lại rõ hơn một chút.'}
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
