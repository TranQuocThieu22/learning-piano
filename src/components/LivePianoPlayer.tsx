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
  { below: 100, color: 'red', text: 'Chậm — thử cắm tai nghe có dây' },
  /*
   * Trên 100ms gần như chắc là tiếng đang đi qua Bluetooth âm thanh (150-250ms), không phải
   * loa điện thoại. Đã gặp thật 15/09/2026: thử FP-30X nối Bluetooth thấy 180-195ms, tưởng
   * loa điện thoại chậm — thật ra tai nghe Bluetooth vẫn đang nối với điện thoại; tắt đi thì
   * tiếng ra nhanh. Nói thẳng thủ phạm, người học khỏi đoán.
   */
  { below: Infinity, color: 'red', text: 'Rất chậm — tai nghe hay loa Bluetooth đang nối với điện thoại? Tắt đi, hoặc cắm tai nghe có dây' },
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
        description="Bấm nối rồi đánh thử một phím. Đàn vẫn tự kêu thì xem cách tắt tiếng đàn ở cuối trang, để khỏi nghe hai tiếng chồng nhau."
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
          {/*
            * Nói trước khi bấm, không đợi bấm xong: đã thử trên Roland FP-30X — đàn lặng lẽ bỏ
            * qua lệnh Local Control, app không có cách nào biết, người học chỉ thấy nút vô tác dụng.
            */}
          {speaker === null && (
            <Text size="xs" c="dimmed" mt={4} data-testid="speaker-note">
              Chỉ một số đàn nhận lệnh này: đàn Yamaha thường nhận, Roland và Kawai thì không.
            </Text>
          )}
          {speaker === 'off' && (
            <Text size="xs" c="dimmed" mt={4} data-testid="speaker-note">
              Đàn vẫn kêu thì cây này không nhận lệnh — xem cách tắt tiếng đàn ở cuối trang. Rời
              trang là loa đàn tự bật lại; không thì tắt đàn rồi mở lại.
            </Text>
          )}
          {speaker === 'failed' && (
            <Text size="xs" c="orange" mt={4} data-testid="speaker-note">
              Không gửi được lệnh sang đàn — xem cách tắt tiếng đàn ở cuối trang.
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
            /*
             * "Tiếng ra chậm" chứ không "độ trễ": số này chỉ là đường tiếng ra loa hay tai nghe
             * (`baseLatency` + `outputLatency`), không tính dây MIDI hay Bluetooth MIDI. Ghi "độ
             * trễ" thì lần thử 15/09 nối Bluetooth thấy 187ms, cắm dây thấy 57ms, và ai cũng tưởng
             * Bluetooth MIDI chậm — thật ra lúc đó tiếng đang đi ra tai nghe Bluetooth.
             */
            <Badge
              color={level.color}
              variant="light"
              size="lg"
              tt="none"
              styles={{ root: { height: 'auto', paddingBlock: 4 }, label: { whiteSpace: 'normal' } }}
              data-testid="live-latency"
            >
              Tiếng ra chậm khoảng {live.latencyMs}ms · {level.text}
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
