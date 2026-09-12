'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import { loadSavedProgram, normalizeBufferVolume, synthOptions } from '@/lib/soundfont';

/**
 * Phát một **câu nhạc ngắn** từ chuỗi ABC. Không vẽ gì ra màn hình.
 *
 * Dùng ở bài luyện tai: app phát một câu, người học mò lại trên đàn thật. Khác
 * hẳn `useSheetAudio` của bài học nên cố ý không gộp — ở đó là cả một bản nhạc
 * có tua, lặp, đổi tốc độ, thanh tiến trình; ở đây chỉ có "kêu lên một câu", và
 * **người học không được nhìn thấy nốt** nên chẳng có gì để vẽ.
 *
 * Vẫn phải cho abcjs một thẻ để dựng bản nhạc (`sinkRef`) rồi mới lấy được phần
 * tiếng — thẻ đó ẩn đi, xem chú thích ở chỗ dùng.
 */

export interface PhrasePlayer {
  /** Gắn vào một thẻ ẩn để abcjs có chỗ dựng bản nhạc. */
  sinkRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Đang nạp và bắt đầu phát.
   *
   * Tắt ngay sau khi tiếng bắt đầu kêu, KHÔNG đợi câu kết thúc: nó dùng để khoá
   * nút *Nghe lại* trong lúc đang nạp mẫu âm, không phải để đếm thời gian.
   */
  playing: boolean;
  /**
   * Trả về **có kêu được hay không**. Chỗ gọi cần biết: bảo người học "nghe lại"
   * trong khi họ chưa từng nghe gì là một cái nút nói dối.
   */
  play: (abc: string) => Promise<boolean>;
  stop: () => void;
}

export function usePhrasePlayer(): PhrasePlayer {
  const sinkRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<InstanceType<typeof ABCJS.synth.CreateSynth> | null>(null);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    synthRef.current?.stop();
  }, []);

  // Rời trang giữa lúc đang kêu thì phải tắt: điều hướng trong Next.js không tải
  // lại trang, nên tiếng bám theo sang trang mới mà không còn nút nào tắt được.
  useEffect(() => () => {
    synthRef.current?.stop();
  }, []);

  /**
   * Dựng lại bộ phát mỗi lần thay vì giữ một cái: câu đổi thì chuỗi âm thanh
   * cũng đổi, mà `CreateSynth` gắn chặt với đúng một bản nhạc. Dừng cái cũ trước
   * khi dựng cái mới, nếu không bấm *Nghe lại* nhanh hai lần là hai câu kêu chồng.
   */
  const play = useCallback(async (abc: string): Promise<boolean> => {
    const sink = sinkRef.current;
    if (!sink || !ABCJS.synth.supportsAudio()) return false;

    synthRef.current?.stop();
    setPlaying(true);
    try {
      const [tune] = ABCJS.renderAbc(sink, abc, {});
      const synth = new ABCJS.synth.CreateSynth();
      synthRef.current = synth;
      await synth.init({ visualObj: tune, options: synthOptions(loadSavedProgram()) });
      await synth.prime();
      // Bộ mẫu âm thu rất nhỏ; kéo to ngay trên buffer như chỗ phát bản nhạc mẫu.
      const buffer = synth.getAudioBuffer?.();
      if (buffer) normalizeBufferVolume(buffer);
      synth.start();
      return true;
    } catch {
      // Trình duyệt chặn âm thanh khi chưa có cử chỉ người dùng, hoặc mẫu âm tải
      // hỏng. Không ném ra ngoài: bài luyện vẫn dùng được, chỉ là chưa nghe thấy.
      return false;
    } finally {
      setPlaying(false);
    }
  }, []);

  return { sinkRef, playing, play, stop };
}
