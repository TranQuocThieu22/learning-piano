'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Slider,
  Stack,
  Text,
} from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';

const MIN_BPM = 40;
const MAX_BPM = 208;

/** Nhìn trước 100ms và kiểm tra mỗi 25ms — cách chuẩn để giữ nhịp chính xác.
 *  Dùng setInterval đơn thuần sẽ bị trôi nhịp vì trình duyệt không đảm bảo
 *  gọi đúng thời điểm, còn Web Audio thì có đồng hồ riêng rất chuẩn. */
const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD_MS = 25;

/** Tên gọi tốc độ trong âm nhạc, để người học làm quen dần thuật ngữ. */
function tempoName(bpm: number): string {
  if (bpm < 60) return 'Largo — rất chậm';
  if (bpm < 76) return 'Adagio — chậm rãi';
  if (bpm < 108) return 'Andante — thong thả';
  if (bpm < 120) return 'Moderato — vừa phải';
  if (bpm < 168) return 'Allegro — nhanh, vui';
  return 'Presto — rất nhanh';
}

export function Metronome({
  initialBpm = 60,
  initialBeatsPerBar = 4,
}: {
  initialBpm?: number;
  initialBeatsPerBar?: number;
}) {
  const [bpm, setBpm] = useState(initialBpm);
  const [beatsPerBar, setBeatsPerBar] = useState(initialBeatsPerBar);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const queueRef = useRef<{ beat: number; time: number }[]>([]);
  const tapTimesRef = useRef<number[]>([]);

  // Bộ lập lịch chạy trong interval nên phải đọc giá trị mới nhất qua ref.
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerBar);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    beatsRef.current = beatsPerBar;
  }, [beatsPerBar]);

  const playClick = useCallback((time: number, accent: boolean) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Phách đầu ô nhịp kêu cao hơn để dễ nhận ra điểm bắt đầu.
    osc.frequency.value = accent ? 1600 : 900;
    gain.gain.setValueAtTime(accent ? 0.5 : 0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    queueRef.current = [];
    setRunning(false);
    setCurrentBeat(-1);
  }, []);

  const start = useCallback(() => {
    // AudioContext chỉ được tạo/chạy sau thao tác của người dùng.
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();

    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.08;
    queueRef.current = [];
    setRunning(true);

    timerRef.current = setInterval(() => {
      const c = ctxRef.current;
      if (!c) return;
      while (nextNoteTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const beat = beatRef.current;
        playClick(nextNoteTimeRef.current, beat === 0);
        queueRef.current.push({ beat, time: nextNoteTimeRef.current });
        nextNoteTimeRef.current += 60 / bpmRef.current;
        beatRef.current = (beat + 1) % beatsRef.current;
      }
    }, LOOKAHEAD_MS);

    // Đèn nhấp nháy bám theo đồng hồ của Web Audio, không bám theo interval.
    const tick = () => {
      const c = ctxRef.current;
      if (c) {
        while (queueRef.current.length && queueRef.current[0].time <= c.currentTime) {
          setCurrentBeat(queueRef.current.shift()!.beat);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [playClick]);

  useEffect(() => stop, [stop]);

  const handleTap = () => {
    const now = performance.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 3000);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const next = Math.round(60000 / avg);
      if (next >= MIN_BPM && next <= MAX_BPM) setBpm(next);
    }
  };

  /*
   * Mọi thứ ở đây to hơn hẳn phần còn lại của app, có chủ ý: lúc dùng máy đánh
   * nhịp thì điện thoại đang nằm trên giá nhạc, cách mắt nửa sải tay, và người
   * học chạm vội bằng một ngón giữa hai lượt đánh. Con số BPM và chấm phách phải
   * đọc được từ khoảng cách đó; nút phải trúng mà không cần nhìn kỹ.
   */
  return (
    <Paper withBorder p="lg" radius="xl" shadow="sm">
      <Stack gap="lg">
        {/* Chiều cao cố định để chấm to lên lúc sáng không làm cả khối nhảy. */}
        <Group justify="center" gap="md" h={48} align="center">
          {Array.from({ length: beatsPerBar }, (_, i) => (
            <span
              key={i}
              className="beat-dot"
              data-accent={i === 0 || undefined}
              data-active={currentBeat === i || undefined}
            />
          ))}
        </Group>

        <Stack gap={4} align="center">
          <Text className="metronome-bpm">{bpm}</Text>
          <Text size="sm" c="dimmed">
            phách mỗi phút (BPM)
          </Text>
          <Badge variant="light" color="orange" size="lg" mt={4}>
            {tempoName(bpm)}
          </Badge>
        </Stack>

        <Box px={4} pb="md">
          <Slider
            value={bpm}
            onChange={setBpm}
            min={MIN_BPM}
            max={MAX_BPM}
            label={null}
            size="lg"
            thumbSize={28}
            color="orange"
            aria-label="Tốc độ (BPM)"
            marks={[
              { value: 60, label: '60' },
              { value: 90, label: '90' },
              { value: 120, label: '120' },
              { value: 160, label: '160' },
            ]}
          />
        </Box>

        <Group grow gap="xs">
          {[-5, -1, 1, 5].map((d) => (
            <Button
              key={d}
              variant="light"
              color="orange"
              size="md"
              px={0}
              onClick={() =>
                setBpm((b) => Math.min(MAX_BPM, Math.max(MIN_BPM, b + d)))
              }
            >
              {d > 0 ? `+${d}` : d}
            </Button>
          ))}
        </Group>

        <div>
          <Text size="sm" fw={600} mb={6}>
            Số phách mỗi ô nhịp
          </Text>
          <SegmentedControl
            fullWidth
            size="md"
            color="orange"
            value={String(beatsPerBar)}
            onChange={(v) => setBeatsPerBar(Number(v))}
            data={[
              { value: '4', label: '4/4' },
              { value: '3', label: '3/4 (Waltz)' },
              { value: '2', label: '2/4' },
            ]}
          />
        </div>

        <Stack gap="sm">
          <Button
            size="xl"
            fullWidth
            variant={running ? 'filled' : 'gradient'}
            color={running ? 'red' : undefined}
            gradient={{ from: 'orange.6', to: 'pink.5', deg: 135 }}
            leftSection={running ? <IconPlayerStop size={22} /> : <IconPlayerPlay size={22} />}
            onClick={running ? stop : start}
          >
            {running ? 'Dừng' : 'Bắt đầu'}
          </Button>
          <Button size="lg" fullWidth variant="light" color="orange" onClick={handleTap}>
            Gõ theo nhịp
          </Button>
        </Stack>

        <Text size="xs" c="dimmed" ta="center">
          Bấm &quot;Gõ theo nhịp&quot; vài lần đều tay để máy tự đoán tốc độ bạn muốn.
        </Text>
      </Stack>
    </Paper>
  );
}
