'use client';

import { useMemo } from 'react';
import {
  Badge, Box, Group, Progress, Select, Slider, Stack, Text,
} from '@mantine/core';
import { useLivePiano } from '@/hooks/useLivePiano';
import { usePianoInput, type PianoInput } from '@/hooks/usePianoInput';
import { INSTRUMENT_SELECT_DATA } from '@/lib/soundfont';
import { PianoInputChooser, PianoInputStatus } from './PianoInputPanel';

/**
 * Mốc độ trễ để nói cho người học biết máy mình có hợp không.
 *
 * Dưới 30ms tai không tách được tiếng khỏi lúc ngón tay chạm phím; 30-50ms thấy hơi lợn
 * cợn nhưng tập được; trên 50ms thì người học tưởng tay mình sai nhịp. Số trình duyệt báo
 * chưa gồm độ trễ của dây MIDI hay Bluetooth, nên thật ra còn chậm hơn một chút.
 */
const LATENCY_LEVELS = [
  { below: 30, color: 'teal', text: 'Như đàn thật' },
  { below: 50, color: 'yellow', text: 'Tập được, hơi chậm' },
  { below: Infinity, color: 'red', text: 'Chậm — thử cắm tai nghe có dây' },
];

/**
 * Đánh trên đàn, điện thoại phát tiếng.
 *
 * Chỉ cho nối MIDI: micro nghe được tiếng nghĩa là cây đàn đã tự kêu rồi.
 */
export function LivePianoPlayer() {
  const live = useLivePiano();

  const input = usePianoInput({
    onMidiNote: live.noteOn,
    onMidiNoteOff: live.noteOff,
    onPedal: live.pedal,
    // Trang này không mở micro — xem `midiOnly` ở dưới.
    onMicHeard: () => {},
  });

  /*
   * Bật âm thanh ngay trong cú bấm *Nối MIDI*: trình duyệt điện thoại chặn âm thanh tới
   * cú chạm đầu tiên, và nốt từ dây MIDI không tính là cú chạm. Gói lại ở đây thay vì
   * thêm một nút *Bật tiếng* riêng — người học đang để hai tay trên đàn, bớt được một
   * bước là bớt một lần phải với lên màn hình.
   */
  const wiredInput: PianoInput = useMemo(() => ({
    ...input,
    chooseMidi: () => {
      live.start();
      input.chooseMidi();
    },
  }), [input, live]);

  if (!input.mode) {
    return (
      <PianoInputChooser
        input={wiredInput}
        midiOnly
        title="Nối đàn vào điện thoại"
        description="Bấm nối rồi đánh thử một phím. Nhớ vặn nhỏ loa của đàn để khỏi nghe hai tiếng chồng nhau."
      />
    );
  }

  const level = live.latencyMs === null ? null : LATENCY_LEVELS.find((l) => live.latencyMs! < l.below)!;

  return (
    <PianoInputStatus input={wiredInput}>
      <Stack gap="sm" mt="md">
        <Select
          label="Tiếng đàn"
          data={INSTRUMENT_SELECT_DATA}
          value={live.instrument.id}
          allowDeselect={false}
          onChange={(value) => {
            if (value) live.chooseInstrument(value);
          }}
          data-testid="live-instrument"
        />

        <Box>
          <Text size="sm" mb={4}>Âm lượng</Text>
          <Slider
            value={Math.round(live.volume * 100)}
            onChange={(value) => live.setVolume(value / 100)}
            min={0}
            max={100}
            label={(value) => `${value}%`}
            size="lg"
            aria-label="Âm lượng tiếng đàn"
          />
        </Box>

        {live.loaded < live.loadTotal && (
          <Box data-testid="live-loading">
            <Text size="xs" c="dimmed" mb={4}>
              Đang tải tiếng đàn {live.loaded}/{live.loadTotal} — đánh được luôn, vài nốt xa có thể
              chưa có tiếng ở lần bấm đầu.
            </Text>
            <Progress value={(live.loaded / live.loadTotal) * 100} size="sm" animated={false} />
          </Box>
        )}

        <Group gap="xs" wrap="wrap">
          {level && (
            <Badge color={level.color} variant="light" size="lg" data-testid="live-latency">
              Độ trễ khoảng {live.latencyMs}ms · {level.text}
            </Badge>
          )}
          {live.pedalDown && (
            <Badge color="grape" variant="light" size="lg">Đang đạp pedal</Badge>
          )}
        </Group>
      </Stack>
    </PianoInputStatus>
  );
}
