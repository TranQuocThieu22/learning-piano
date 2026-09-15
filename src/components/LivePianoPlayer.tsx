'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Badge, Box, Button, Group, Progress, Select, Slider, Stack, Text,
} from '@mantine/core';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import { useLivePiano } from '@/hooks/useLivePiano';
import { usePianoInput, type PianoInput } from '@/hooks/usePianoInput';
import { localControlMessages } from '@/lib/midi-messages';
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
   * Tắt loa của đàn bằng lệnh Local Control, để không nghe hai tiếng lệch nhau.
   *
   * `null` là chưa bấm lần nào; `'failed'` là không có đường gửi sang đàn. Gửi được
   * cũng KHÔNG có nghĩa đàn đã câm — đàn không hiểu lệnh thì lặng lẽ bỏ qua, app không
   * có cách nào biết, nên chữ dưới nút phải nói cho người học cách tự kiểm.
   */
  const [speaker, setSpeaker] = useState<'on' | 'off' | 'failed' | null>(null);
  const speakerOffRef = useRef(false);
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  });

  const toggleSpeaker = useCallback(async () => {
    const turnOff = !speakerOffRef.current;
    const sent = await inputRef.current.send(localControlMessages(!turnOff));
    if (!sent) {
      setSpeaker('failed');
      return;
    }
    speakerOffRef.current = turnOff;
    setSpeaker(turnOff ? 'off' : 'on');
  }, []);

  /**
   * Trả lại tiếng cho đàn trước khi rời đi. Đàn giữ Local Control tới lúc tắt nguồn,
   * nên quên bước này thì lần sau người học đánh đàn không có app, đàn câm mà không
   * biết vì sao.
   */
  const restoreSpeaker = useCallback(() => {
    if (!speakerOffRef.current) return;
    speakerOffRef.current = false;
    void inputRef.current.send(localControlMessages(true));
  }, []);

  /*
   * `pagehide` cho lúc tải lại trang hay đóng thẻ — effect không kịp dọn khi trang bị huỷ.
   * Cố ý không nghe `visibilitychange`: người học chuyển sang app khác một lát rồi quay
   * lại thì loa đàn không nên bật lên giữa chừng.
   */
  useEffect(() => {
    window.addEventListener('pagehide', restoreSpeaker);
    return () => {
      window.removeEventListener('pagehide', restoreSpeaker);
      restoreSpeaker();
    };
  }, [restoreSpeaker]);

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
    // Gửi lệnh bật loa khi đường nối còn sống; ngắt Bluetooth tự đợi lệnh ghi xong.
    reset: () => {
      restoreSpeaker();
      setSpeaker(null);
      input.reset();
    },
  }), [input, live, restoreSpeaker]);

  if (!input.mode) {
    return (
      <PianoInputChooser
        input={wiredInput}
        midiOnly
        title="Nối đàn vào điện thoại"
        description="Bấm nối rồi đánh thử một phím. Nối xong có nút tắt loa của đàn, để khỏi nghe hai tiếng chồng nhau."
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

        <Box>
          <Button
            fullWidth
            size="md"
            variant={speaker === 'off' ? 'light' : 'filled'}
            leftSection={speaker === 'off' ? <IconVolume size={20} /> : <IconVolumeOff size={20} />}
            onClick={toggleSpeaker}
            data-testid="speaker-toggle"
          >
            {speaker === 'off' ? 'Bật lại loa đàn' : 'Tắt loa đàn'}
          </Button>
          {speaker === 'off' && (
            <Text size="xs" c="dimmed" mt={4} data-testid="speaker-note">
              Đàn vẫn kêu thì cây này không nhận lệnh — vặn nhỏ loa, hoặc cắm tai nghe vào đàn.
              Rời trang là loa đàn tự bật lại; không thì tắt đàn rồi mở lại.
            </Text>
          )}
          {speaker === 'failed' && (
            <Text size="xs" c="orange" mt={4} data-testid="speaker-note">
              Không gửi được lệnh sang đàn. Vặn nhỏ loa, hoặc cắm tai nghe vào lỗ tai nghe của đàn.
            </Text>
          )}
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
