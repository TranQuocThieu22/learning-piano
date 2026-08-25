'use client';
import { useState } from 'react';
import { ActionIcon, Group, NumberInput, Slider, Text, Tooltip } from '@mantine/core';
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconRepeat,
} from '@tabler/icons-react';

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface SheetAudioControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  /** Vị trí đang phát, tính từ 0 tới 1. */
  progress: number;
  /** Tổng thời lượng bản nhạc (mili giây) ở tốc độ hiện tại. */
  totalMs: number;
  /** Tốc độ phát, tính theo phần trăm nhịp gốc ghi trong bản nhạc. */
  warp: number;
  bpm: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onToggleLoop: () => void;
  onSeek: (progress: number) => void;
  onWarpChange: (warp: number) => void;
}

/**
 * Thanh điều khiển nghe mẫu, dựng bằng Mantine để đồng bộ với phần còn lại
 * của giao diện. Thay cho thanh mặc định abcjs tự sinh ra (`abcjs-audio.css`)
 * vốn có màu và bo góc riêng, không theo theme sáng/tối của app.
 */
export function SheetAudioControls({
  isPlaying,
  isLooping,
  progress,
  totalMs,
  warp,
  bpm,
  onPlayPause,
  onRestart,
  onToggleLoop,
  onSeek,
  onWarpChange,
}: SheetAudioControlsProps) {
  // Trong lúc người học kéo con trượt thì bám theo tay họ, chỉ thật sự tua khi
  // thả ra — tua liên tục sẽ phải dựng lại chuỗi âm thanh ở từng bước, rất giật.
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const sliderValue = scrubbing ?? progress * 100;

  return (
    <Group gap="sm" mt="sm" wrap="wrap">
      <Group gap={4} wrap="nowrap">
        <Tooltip label={isPlaying ? 'Tạm dừng' : 'Nghe thử'} withArrow>
          <ActionIcon
            variant="filled"
            size="lg"
            radius="xl"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Tạm dừng' : 'Nghe thử'}
            data-testid="audio-play"
          >
            {isPlaying ? <IconPlayerPauseFilled size={18} /> : <IconPlayerPlayFilled size={18} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Về đầu bài" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="xl"
            onClick={onRestart}
            aria-label="Về đầu bài"
          >
            <IconPlayerSkipBackFilled size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={isLooping ? 'Tắt lặp lại' : 'Lặp lại liên tục'} withArrow>
          <ActionIcon
            variant={isLooping ? 'light' : 'subtle'}
            color={isLooping ? 'blue' : 'gray'}
            size="lg"
            radius="xl"
            onClick={onToggleLoop}
            aria-label={isLooping ? 'Tắt lặp lại' : 'Lặp lại liên tục'}
            aria-pressed={isLooping}
          >
            <IconRepeat size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="xs" wrap="nowrap" style={{ flex: '1 1 200px', minWidth: 160 }}>
        <Slider
          size="sm"
          flex={1}
          value={sliderValue}
          min={0}
          max={100}
          step={0.1}
          label={(value) => formatTime((totalMs * value) / 100)}
          onChange={setScrubbing}
          onChangeEnd={(value) => {
            setScrubbing(null);
            onSeek(value / 100);
          }}
          aria-label="Vị trí phát"
        />
        <Text size="xs" c="dimmed" ta="right" w={34} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime((totalMs * sliderValue) / 100)}
        </Text>
      </Group>

      <Group gap={6} wrap="nowrap">
        <NumberInput
          size="xs"
          w={82}
          value={warp}
          min={10}
          max={200}
          step={10}
          clampBehavior="blur"
          suffix="%"
          aria-label="Tốc độ phát"
          onChange={(value) => {
            const next = typeof value === 'number' ? value : Number(value);
            if (Number.isFinite(next) && next >= 10 && next <= 200) onWarpChange(next);
          }}
        />
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {bpm > 0 ? `${bpm} BPM` : ''}
        </Text>
      </Group>
    </Group>
  );
}
