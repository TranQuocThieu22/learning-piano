'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Nháy đỏ một nốt trên khuông nhạc khi người học bấm trượt.
 *
 * Dùng chung cho cả hai chỗ có khuông nhạc: phần *Tập bài này với đàn* của bài
 * học (`useSheetRender`) và bài luyện nhận nốt (`useDrillStaff`). Tách ra vì
 * chép sang chỗ thứ hai là cách repo này vẫn sinh lỗi — xem
 * `.claude/skills/code-standards/SKILL.md`.
 *
 * **Nháy rồi tắt hẳn, không để lại vết.** Đây là luật số 2 trong bốn luật chống
 * áp lực ở `AGENTS.md`: báo "ê, chỗ này này", không phải ghi sổ lỗi. Bấm trượt
 * không lùi con trỏ, không xoá màu xanh đã có, không trừ gì cả.
 */

const MISS_FLASH_CLASS = 'practice-miss-flash';
/** Phải khớp thời lượng keyframes `practice-miss-flash` trong globals.css. */
const MISS_FLASH_MS = 450;

export interface NoteFlash {
  /**
   * Nháy một nốt. `key` là số thứ tự của nốt trong bản nhạc hoặc của phách
   * trong câu — chỉ dùng để nhận ra "vẫn nốt đó" khi bấm trượt liên tiếp.
   */
  flash: (key: number, group: HTMLElement[]) => void;
  /** Dọn sạch: dừng mọi hẹn giờ và gỡ lớp. Gọi trước mỗi lần vẽ lại. */
  clearFlashes: () => void;
}

export function useNoteFlash(): NoteFlash {
  /** Hẹn giờ gỡ lớp, kèm chính nhóm phần tử đã gắn, để dọn được mà không cần hỏi lại ai. */
  const timersRef = useRef(new Map<number, { timer: number; group: HTMLElement[] }>());

  const clearFlashes = useCallback(() => {
    for (const { timer, group } of timersRef.current.values()) {
      window.clearTimeout(timer);
      for (const el of group) el.classList?.remove(MISS_FLASH_CLASS);
    }
    timersRef.current.clear();
  }, []);

  /**
   * Bấm sai liên tiếp thì phải cho hiệu ứng chạy lại từ đầu — gỡ lớp ra, **ép
   * trình duyệt tính lại bố cục**, rồi mới gắn vào. Thiếu bước ép tính lại thì
   * trình duyệt gộp hai thao tác làm một và hiệu ứng đứng im ở lần nháy đầu.
   */
  const flash = useCallback((key: number, group: HTMLElement[]) => {
    if (group.length === 0) return;

    const pending = timersRef.current.get(key);
    if (pending) window.clearTimeout(pending.timer);

    for (const el of group) {
      el.classList?.remove(MISS_FLASH_CLASS);
      void el.getBoundingClientRect();
      el.classList?.add(MISS_FLASH_CLASS);
    }

    const timer = window.setTimeout(() => {
      for (const el of group) el.classList?.remove(MISS_FLASH_CLASS);
      timersRef.current.delete(key);
    }, MISS_FLASH_MS);
    timersRef.current.set(key, { timer, group });
  }, []);

  // Bản nhạc bị dựng lại trong lúc còn hẹn giờ thì các hẹn giờ đó trỏ vào phần
  // tử đã bị vứt. Dọn sạch khi rời trang.
  useEffect(() => clearFlashes, [clearFlashes]);

  return { flash, clearFlashes };
}
