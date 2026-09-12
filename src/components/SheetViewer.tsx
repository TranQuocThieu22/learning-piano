'use client';
import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Button, Group, Select, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconDeviceGamepad2,
  IconMinus,
  IconPlus,
} from '@tabler/icons-react';
import { ScorePractice } from './ScorePractice';
import { holdAmbient } from '@/lib/ambient-hold';
import { SheetAudioControls } from './SheetAudioControls';
import { INSTRUMENTS } from '@/lib/soundfont';
import { useSheetRender } from '@/hooks/useSheetRender';
import { useSheetAudio } from '@/hooks/useSheetAudio';

/**
 * Khung xem bản nhạc trong bài học: vẽ khuông, nghe mẫu, và mở phần tập với đàn.
 *
 * **Component này không biết bản nhạc được vẽ bằng thư viện nào.** Việc vẽ nằm ở
 * `useSheetRender`, việc phát tiếng ở `useSheetAudio`; ở đây chỉ còn giao diện —
 * phóng to, chế độ tập trung, thanh nghe mẫu, ô chọn tiếng đàn. Đổi thư viện vẽ
 * nhạc là viết lại hai hook đó, không phải đọc lại file này.
 */

/**
 * Khoảng phóng to cho phép trong chế độ tập trung.
 *
 * Chặn trên 3 lần vì to hơn nữa thì mỗi màn hình chỉ còn một hai ô nhịp, phải
 * cuộn ngang liên tục — mà lúc đang đánh thì hai tay đang bận, không cuộn được.
 */
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export function SheetViewer({ abcNotation }: { abcNotation: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  const sheet = useSheetRender(paperRef, abcNotation);
  const audio = useSheetAudio(audioRef, sheet.tune, sheet.bpmAt);

  const [practiceOpen, setPracticeOpen] = useState(false);
  /**
   * Chế độ tập trung: bản nhạc phủ kín màn hình, giấu hết phần còn lại của trang.
   *
   * Chỉ dùng lúc tập với đàn. Khi đó mắt người học phải ở trên khuông nhạc, mà
   * phần chữ của bài, thanh tab dưới đáy và thanh mời cài đặt đều đang tranh chỗ
   * với nó — trên điện thoại thì gay gắt nhất, có khi chỉ còn thấy hai dòng nhạc.
   */
  const [focused, setFocused] = useState(false);
  /**
   * Mức phóng to bản nhạc trong chế độ tập trung, tính theo lần.
   *
   * Vì sao cần: `responsive: 'resize'` co bản nhạc vừa đúng bề ngang khung chứa,
   * nên trên màn hình hẹp một dòng nhạc dài bị ép nhỏ lại — đo được là còn 44%
   * cỡ gốc, nốt cao 43px, trong khi phía dưới còn thừa 380px trống. Phủ kín màn
   * hình mà chữ vẫn bé thì chế độ tập trung không giải quyết được gì.
   */
  const [zoom, setZoom] = useState(1);

  /**
   * Đổi bài thì đóng hết những thứ đang mở của bài cũ.
   *
   * Đặt lại ngay trong lúc render chứ không trong effect — xem lý do ở chỗ
   * tương tự trong `useSheetAudio.ts`.
   */
  const [lastAbc, setLastAbc] = useState(abcNotation);
  if (lastAbc !== abcNotation) {
    setLastAbc(abcNotation);
    setPracticeOpen(false);
    setFocused(false);
    setZoom(1);
  }

  const showPracticeButton = sheet.events.length > 0 && !practiceOpen;

  /**
   * Trả về `undefined` ở lần dựng đầu (Mantine bật `getInitialValueInEffect`),
   * nên HTML của máy chủ và của trình duyệt khớp nhau — không lỗi hydration.
   */
  const dungDungTrenDienThoai = useMediaQuery('(max-width: 48em) and (orientation: portrait)');

  /**
   * Bảo nhạc nền im trong lúc bản nhạc này đang kêu, và trong lúc người học mở
   * phần tập với đàn.
   *
   * Đây là chỗ duy nhất biết được hai việc đó đang xảy ra. Nhạc nền không tắt
   * theo trang nữa — đọc phần chữ của bài thì vẫn có nhạc — nên phải báo bằng
   * sự kiện, xem `src/lib/ambient-hold.ts`.
   */
  useEffect(() => {
    if (!audio.isPlaying) return;
    return holdAmbient();
  }, [audio.isPlaying]);

  useEffect(() => {
    if (!practiceOpen) return;
    return holdAmbient();
  }, [practiceOpen]);

  /**
   * Khoá cuộn nền và cho phím Esc thoát, chỉ trong lúc đang tập trung.
   *
   * Khoá cuộn đặt trên `body` chứ không trên lớp phủ: lớp phủ cuộn được bên trong
   * nó, còn trang phía sau thì phải đứng yên — thiếu cái này thì vuốt quá đáy bản
   * nhạc là cả bài học phía dưới trôi theo.
   */
  useEffect(() => {
    if (!focused) return;

    document.body.classList.add('sheet-focus-lock');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('sheet-focus-lock');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [focused]);

  return (
    <div
      className={`sheet-music-wrapper${focused ? ' is-focused' : ''}`}
      style={{
        // Lề, nền, viền, bo góc và padding của khung đều nằm ở globals.css
        // (.sheet-music-wrapper), KHÔNG đặt ở đây: style nội tuyến thắng mọi luật
        // CSS thường, nên để ở đây thì chế độ tập trung không gỡ được chúng — viền
        // và bo góc từng vẫn còn nguyên trong lớp phủ vì đúng lý do này.
        //
        // CSS đọc biến này để nhân bề ngang SVG lên; ngoài chế độ tập trung thì
        // không luật nào dùng tới nên đặt sẵn cũng vô hại.
        ['--sheet-zoom' as string]: String(zoom),
      }}
    >
      {focused && (
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Thu nhỏ bản nhạc"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
              data-testid="zoom-out"
            >
              <IconMinus size={18} />
            </ActionIcon>
            {/* Bề ngang cố định để con số đổi mà nút hai bên không nhảy chỗ. */}
            <Text size="sm" fw={600} ta="center" w={52} data-testid="zoom-level">
              {Math.round(zoom * 100)}%
            </Text>
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Phóng to bản nhạc"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
              data-testid="zoom-in"
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>

          <Button
            variant="light"
            size="xs"
            leftSection={<IconArrowsMinimize size={16} />}
            onClick={() => setFocused(false)}
            data-testid="exit-focus"
          >
            Thoát
          </Button>
        </Group>
      )}

      {/*
        Điện thoại dựng đứng là trường hợp tệ nhất: một dòng nhạc vốn rộng và
        thấp, ép vào bề ngang hẹp thì nốt bé lại còn phía dưới thừa cả mảng trống.
        Không mức phóng nào chữa được — phóng lên là phải cuộn ngang, mà lúc đánh
        thì hai tay đang bận. Xoay ngang máy tăng gần gấp đôi bề ngang, đó mới là
        câu trả lời đúng. Manifest cố ý không khoá hướng màn hình chính vì việc này.
      */}
      {focused && dungDungTrenDienThoai && (
        <Text size="xs" c="dimmed" ta="center" data-testid="rotate-hint">
          Xoay ngang máy để bản nhạc to gần gấp đôi.
        </Text>
      )}

      <div ref={paperRef} className="sheet-music-paper" style={{ background: '#fff', color: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}></div>
      {/* Thanh mặc định của bộ phát — ẩn đi, chỉ giữ làm chỗ cho nó ghi trạng thái. */}
      <div ref={audioRef} className="sheet-music-audio" style={{ display: 'none' }}></div>

      {/* Lúc tập trung thì giấu phần nghe mẫu: người học đang đánh bằng tay, không
          nghe máy phát, và mỗi thứ còn trên màn hình đều lấy mất chỗ của khuông nhạc. */}
      {audio.ready && !focused && (
        <SheetAudioControls
          isPlaying={audio.isPlaying}
          isLooping={audio.isLooping}
          progress={audio.progress}
          totalMs={audio.totalMs}
          warp={audio.warp}
          bpm={audio.bpm}
          onPlayPause={audio.playPause}
          onRestart={audio.restart}
          onToggleLoop={audio.toggleLoop}
          onSeek={audio.seek}
          onWarpChange={audio.changeWarp}
        />
      )}

      {/* Canh đáy để nút thẳng hàng với ô chọn — ô chọn bị nhãn đẩy xuống thấp hơn. */}
      {(audio.ready || showPracticeButton || practiceOpen) && !focused && (
        <Group mt="sm" gap="sm" align="flex-end">
          {audio.ready && (
            <Select
              size="xs"
              label="Tiếng đàn khi nghe mẫu"
              data={['Piano cơ', 'Piano điện', 'Khác'].map((group) => ({
                group,
                items: INSTRUMENTS.filter((i) => i.group === group).map((i) => ({
                  value: String(i.program),
                  label: i.label,
                })),
              }))}
              value={String(audio.program)}
              allowDeselect={false}
              // Cả bề ngang trên điện thoại: 240px cạnh một cái nút là tràn dòng lệch lạc.
              w={{ base: '100%', xs: 240 }}
              onChange={(value) => {
                if (value) audio.chooseProgram(Number(value));
              }}
            />
          )}

          {showPracticeButton && (
            <Button
              variant="gradient"
              size="sm"
              w={{ base: '100%', xs: 'auto' }}
              leftSection={<IconDeviceGamepad2 size={18} />}
              onClick={() => setPracticeOpen(true)}
              data-testid="open-practice"
            >
              Tập bài này với đàn
            </Button>
          )}

          {/* Chỉ hiện khi đã mở phần tập với đàn: ngoài lúc đó thì phủ kín màn hình
              bằng mỗi bản nhạc không giúp gì, người học vẫn cần đọc phần chữ của bài. */}
          {practiceOpen && (
            <Button
              variant="light"
              size="sm"
              w={{ base: '100%', xs: 'auto' }}
              leftSection={<IconArrowsMaximize size={18} />}
              onClick={() => setFocused(true)}
              data-testid="enter-focus"
            >
              Chế độ tập trung
            </Button>
          )}
        </Group>
      )}

      {practiceOpen && (
        <ScorePractice
          expected={sheet.events}
          onResults={sheet.paintResults}
          onLiveMatch={sheet.paintLiveMatches}
          onWrongNote={sheet.flashWrongNote}
          listenPaused={audio.isPlaying}
        />
      )}
    </div>
  );
}
