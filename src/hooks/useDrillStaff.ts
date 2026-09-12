'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';
import ABCJS from 'abcjs';
import type { NoteTimingEvent, TuneObject } from 'abcjs';
import { type DrillQuestion, questionAbc } from '@/lib/midi-notes';
import {
  anchorTransform, BAR_MIN_UNITS, FOCUS_MAX_FACTOR, scaleBox, staffBox, staffScale,
} from '@/lib/staff-anchor';

/**
 * **Cửa vẽ khuông nhạc của bài luyện nhận nốt.**
 *
 * Cùng vai với `useSheetRender` ở bài học, nhưng không gộp làm một được: bản nhạc
 * bài học là một bài dài, cuộn được, người học đọc; còn đây là **một câu hỏi**
 * phải nằm gọn trong một khung cao cố định, đọc được từ giá nhạc cách nửa sải
 * tay, và **neo đúng chỗ** để năm dòng kẻ không nhảy mỗi câu một nơi. Gộp hai
 * thứ này thì được một hàm đầy cờ bật/tắt.
 *
 * Gần hết các bẫy hình học của abcjs nằm trong file này — bẫy 27 tới 33. Chúng
 * dính vào nhau nên phải ở cùng một chỗ, và thứ tự các bước trong hàm vẽ là thứ
 * tự đã trả giá mới có:
 *
 * 1. **Xoá `width` abcjs ghi lần trước** rồi mới đo bề ngang khung — không thì
 *    lần này đo lại chính cái ảnh cũ (bẫy 30).
 * 2. **Nhặt phần tử từng phách và tô con trỏ NGAY sau khi vẽ**, không gửi gắm cho
 *    một hiệu ứng khác: phần tử vừa bị thay mới toàn bộ (bẫy 33).
 * 3. **Trả `overflow` của thẻ bọc về `visible`** sau mỗi lần vẽ, không thì phép
 *    neo dịch ảnh xuống là mất mấy dòng kẻ dưới của khuông Pha (bẫy 29).
 * 4. **Đo bằng `getBBox`**, không phải `getBoundingClientRect` (bẫy 27).
 * 5. **Ghi lại cả tỉ lệ của abcjs** khi đặt `transform`, vì abcjs cài tuỳ chọn
 *    `scale` bằng chính thuộc tính đó (bẫy 28).
 */

/** Padding dọc của khung giấy nhạc, cộng cả hai mép. */
export const STAFF_BOX_PADDING_Y = 16;

/** abcjs gắn noteTimings lên tune sau khi gọi setTiming, nhưng chưa khai báo trong .d.ts. */
type TuneWithTimings = TuneObject & { noteTimings?: NoteTimingEvent[] };

/**
 * Phần tử SVG của **từng phách**, để tô được phách đang chờ và phách đã xong.
 *
 * Lấy qua `noteTimings` của abcjs chứ không tự đếm thẻ trong DOM: khuông đôi vẽ
 * xong bè trên mới tới bè dưới, nên thứ tự trong DOM không phải thứ tự phách.
 * `noteTimings` thì gom đúng những gì vang lên CÙNG một lúc vào một sự kiện —
 * đúng bằng định nghĩa một phách ở đây.
 *
 * Số sự kiện không khớp số phách thì trả về rỗng: thà không tô gì còn hơn tô
 * nhầm sang nốt người học chưa đánh tới.
 */
function beatElements(tune: TuneObject, beats: number): HTMLElement[][] {
  try {
    // Bắt buộc gọi setUpAudio trước setTiming, không thì noteTimings rỗng.
    tune.setUpAudio({});
    tune.setTiming();
    const out = ((tune as TuneWithTimings).noteTimings ?? [])
      .filter((ev) => ev.type === 'event')
      .map((ev) => (ev.elements ?? []).flat());
    return out.length === beats ? out : [];
  } catch {
    return [];
  }
}

/** Nốt đang chờ — con trỏ, không phải điểm số. Chỉ nhích khi người học bấm đúng. */
const WAITING_CLASS = 'drill-beat-waiting';
/** Nốt đã bấm đúng, dùng chung lớp với phần tập theo bản nhạc. */
const DONE_CLASS = 'practice-correct';

export interface DrillStaffOptions {
  /** Thẻ abcjs vẽ vào. */
  paperRef: RefObject<HTMLDivElement | null>;
  /** Khung giấy nhạc bao ngoài — chỗ đo chiều cao thật lúc tập trung. */
  boxRef: RefObject<HTMLDivElement | null>;
  question: DrillQuestion | null;
  /** Cả hai tay thì vẽ khuông đôi như bản nhạc piano thật. */
  grandStaff: boolean;
  focused: boolean;
  /** Kích thước khung đo được; đổi là phải vẽ lại (xoay máy — bẫy 32). */
  boxSize: { w: number; h: number };
  /**
   * Phách đang chờ, đọc **lúc vẽ xong**.
   *
   * Nhận bằng ref chứ không bằng giá trị, vì phách nhích thì **chỉ tô lại, không
   * vẽ lại**: vẽ lại là cả ô nhịp nháy một cái mỗi lần bấm đúng một nốt, mà mắt
   * người học đang bám vào đúng chỗ đó.
   */
  beatRef: RefObject<number>;
}

export interface DrillStaff {
  /** Tô con trỏ: phách đã xong màu xanh, phách đang chờ màu tím. */
  paintCursor: (beat: number, done: boolean) => void;
}

export function useDrillStaff({
  paperRef, boxRef, question, grandStaff, focused, boxSize, beatRef,
}: DrillStaffOptions): DrillStaff {
  const beatElementsRef = useRef<HTMLElement[][]>([]);

  /**
   * Là **hàm**, không phải hiệu ứng riêng, và đây là chỗ đã sai hai lần theo cùng
   * một kiểu. Mỗi lần khuông nhạc được vẽ lại — đổi câu, vào/ra chế độ tập trung,
   * **xoay máy** — thì `beatElementsRef` trỏ sang phần tử SVG mới toanh, còn màu
   * thì vừa được đặt lên mấy phần tử vừa bị vứt đi. Để tô màu trong một hiệu ứng
   * riêng thì mỗi lần thêm một thứ khiến bản nhạc vẽ lại là phải nhớ thêm nó vào
   * danh sách phụ thuộc của hiệu ứng kia nữa — và quên là con trỏ lặng lẽ biến
   * mất, không lỗi nào báo. Gọi thẳng ở cuối chỗ vẽ thì không có gì để quên.
   */
  const paintCursor = useCallback((beat: number, done: boolean) => {
    const groups = beatElementsRef.current;
    if (groups.length === 0) return;

    for (const [i, group] of groups.entries()) {
      for (const el of group) {
        el.classList?.remove(DONE_CLASS, WAITING_CLASS);
        if (i < beat) el.classList?.add(DONE_CLASS);
        else if (i === beat) el.classList?.add(WAITING_CLASS);
      }
    }

    /*
     * Phách vừa trả lời xong cũng tô xanh ngay, đừng đợi con trỏ nhích: có 900ms
     * giữa lúc đúng và lúc sang phách mới, không tô thì đúng khoảng đó khuông
     * nhạc không phản hồi gì.
     */
    if (done) {
      for (const el of groups[beat] ?? []) {
        el.classList?.remove(WAITING_CLASS);
        el.classList?.add(DONE_CLASS);
      }
    }
  }, []);

  /*
   * Vẽ lại khuông nhạc mỗi khi đổi câu hỏi hoặc đổi số khuông — rồi **neo nó lại**.
   *
   * abcjs vẽ ảnh cao vừa đúng nội dung, nên nốt càng nhiều dòng kẻ phụ thì ảnh
   * càng cao và năm dòng kẻ trôi đi mỗi câu một chỗ. Sau khi vẽ xong, đo dòng kẻ
   * trên cùng rồi dịch ảnh về đúng chỗ neo — luật tính nằm ở `staff-anchor.ts`.
   */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    if (!question) {
      paper.innerHTML = '';
      return;
    }
    const bar = question.beats.length > 1;

    /*
     * **Chế độ tập trung phóng CẢ khung LẪN tỉ lệ lên cùng một hệ số.**
     *
     * Hệ số suy từ chỗ thật còn lại: lớp phủ cấp cho khung giấy nhạc bao nhiêu
     * chiều cao thì chia cho chiều cao khung thường ra bấy nhiêu lần. Phóng mỗi
     * tỉ lệ thì nốt cao vượt khung rồi bị chính phép neo thu nhỏ lại — công cốc.
     *
     * Đo `clientHeight` của khung chứ không của thẻ `paper` bên trong: `paper` là
     * thẻ khối, nó cao theo NỘI DUNG chứ không theo chỗ được cấp.
     */
    const baseBox = staffBox(grandStaff);
    const boxEl = boxRef.current;
    const choCao = focused && boxEl ? boxEl.clientHeight - STAFF_BOX_PADDING_Y : baseBox.height;
    /*
     * Hệ số không bao giờ nhỏ hơn 1: khung giấy nhạc đã có `min-height` bằng
     * chiều cao thường và CSS cấm nó co lại, nên chỗ đo được luôn ít nhất bằng
     * ngần ấy. Màn hình thấp thì lớp phủ cuộn, chứ khuông nhạc không bé đi —
     * bật chế độ tập trung mà bản nhạc nhỏ lại thì bật làm gì.
     */
    const focusFactor = focused && choCao > 0
      ? Math.min(FOCUS_MAX_FACTOR, Math.max(1, choCao / baseBox.height))
      : 1;

    const box = focusFactor === 1 ? baseBox : scaleBox(baseBox, focusFactor);
    const abcScale = staffScale(grandStaff) * focusFactor;

    /*
     * **Đo bề ngang khung TRƯỚC khi vẽ**, vì `staffwidth` phải biết có bao nhiêu
     * chỗ thì mới kéo giãn được cho đầy. Xoá `width` abcjs ghi lần trước, không
     * thì lần này đo lại chính cái ảnh cũ — bẫy 30.
     *
     * `staffwidth` tính bằng đơn vị abcjs, tức là TRƯỚC khi nhân tỉ lệ, nên phải
     * chia ngược lại. Có sàn `BAR_MIN_UNITS` để khung quá hẹp thì thà thu nhỏ cả
     * bản nhạc còn hơn ép bốn nốt dính vào nhau; phép ép bề ngang bên dưới lo nốt
     * phần thu nhỏ ấy.
     */
    paper.style.width = '';
    const availPx = paper.clientWidth;
    /*
     * Lấp đầy bề ngang ở ô nhịp **và** ở chế độ tập trung. Sàn `BAR_MIN_UNITS`
     * chỉ áp cho ô nhịp: một nốt lẻ không cần chừng ấy chỗ, ép sàn vào là bản
     * nhạc rộng quá khung rồi bị thu nhỏ lại — tập trung mà nốt bé đi.
     */
    const fillWidth = bar || focused;
    const fillUnits = Math.round(availPx / abcScale);
    const staffUnits = bar ? Math.max(BAR_MIN_UNITS, fillUnits) : fillUnits;
    const [tune] = ABCJS.renderAbc(paper, questionAbc(question, grandStaff), {
      /*
       * Khuông đôi cao gấp đôi khuông đơn nên phải thu nhỏ lại — không thì trên
       * điện thoại nó đẩy hết phần phản hồi và hai cái nút xuống dưới màn hình.
       * Hẹp hơn một chút nữa để cả dấu ngoặc ôm hai khuông lẫn vạch nhịp cuối
       * nằm trọn trong khung, khác khuông đơn chỉ có mỗi nốt ở giữa nên hai mép
       * trống bị cắt cũng không mất gì.
       */
      staffwidth: fillWidth ? staffUnits : grandStaff ? 190 : 220,
      /*
       * **`scale` ở đây KHÔNG phải cỡ chữ cuối cùng.** Phép vẽ cuối do transform
       * của mình quyết (xem bẫy 28), nên cái `scale` truyền cho abcjs còn đúng
       * một tác dụng: nó **chia** chỗ dành cho nhạc — nhạc chỉ được xếp vừa
       * `staffwidth / scale` đơn vị, phần còn lại của khung bỏ trống.
       *
       * Đo thật ở tỉ lệ 1.25: nhạc chiếm 76% bề ngang khung, 24% còn lại trắng
       * trơn — đúng cái khoảng trống bên phải mà người dùng chụp màn hình gửi về.
       *
       * Ô nhịp muốn chiếm HẾT bề ngang nên truyền 1. Một nốt lẻ thì giữ nguyên
       * như cũ: nốt nằm giữa một khung rộng gấp đôi, và đó là chủ ý.
       */
      scale: fillWidth ? 1 : abcScale,
      paddingtop: 8,
      paddingbottom: 8,
      paddingleft: 0,
      paddingright: 0,
    });

    // Nhặt phần tử của từng phách NGAY sau khi vẽ, trước khi hiệu ứng tô màu
    // chạy — hiệu ứng đó chỉ gắn lớp, không đụng tới DOM của abcjs.
    beatElementsRef.current = beatElements(tune, question.beats.length);
    // Tô lại NGAY, đừng đợi hiệu ứng khác: phần tử vừa thay mới toàn bộ.
    paintCursor(beatRef.current, false);

    const svg = paper.querySelector('svg');
    const topLine = paper.querySelector('.abcjs-top-line');
    if (!svg || !topLine) return;

    /*
     * abcjs bọc ảnh trong một thẻ `div` của riêng nó và đặt thẳng
     * `overflow: hidden` cùng chiều cao đúng bằng ảnh CHƯA dịch. Phép neo bên
     * dưới dịch ảnh xuống, nên phần thò ra khỏi chiều cao đó bị cắt — mất mấy
     * dòng kẻ dưới cùng của khuông Pha mà không có lỗi nào báo ra. Trả nó về
     * `visible` sau mỗi lần vẽ (abcjs ghi lại thuộc tính này mỗi lần); chỗ cắt
     * thật là cái khung ngoài, đúng như phép neo giả định.
     */
    paper.style.overflow = 'visible';

    /*
     * Đo **trong hệ toạ độ của chính ảnh SVG** bằng `getBBox`, không dùng
     * `getBoundingClientRect`: toạ độ màn hình phụ thuộc vào chỗ ảnh nằm trong
     * trang, mà lúc effect chạy thì trang chưa xếp xong chỗ cho nó — đã thử và
     * lệch 7px.
     *
     * `getBBox` trả về đơn vị TRƯỚC khi nhân tỉ lệ, nên phải nhân `abcScale` vào
     * mới ra px thật trên màn hình.
     */
    const ink = svg.getBBox();
    const topLineY = (topLine as SVGGraphicsElement).getBBox().y * abcScale;
    const { scale, translateX, translateY } = anchorTransform(
      box,
      topLineY,
      ink.y * abcScale,
      (ink.y + ink.height) * abcScale,
      /*
       * Chỉ ô nhịp mới ép bề ngang — xem lý do ở `anchorTransform`. Đo bằng
       * thuộc tính `width` của chính thẻ SVG chứ không bằng `getBBox`: abcjs
       * chừa thêm lề quanh nhạc (khuông đôi còn có dấu ngoặc ôm hai khuông), mà
       * phần lề đó cũng chiếm chỗ thật trong khung.
       */
      /*
       * Ép bề ngang cho ô nhịp (cắt mép là mất nốt), và cho cả chế độ tập trung —
       * ở đó khung rộng hẳn ra nên một nốt lẻ cũng cần được đẩy vào giữa thay vì
       * dính mép trái. Chế độ một nốt thường thì vẫn cố ý để tràn: hai mép bị
       * cắt toàn khoảng trắng, đổi lại nốt to.
       */
      bar || focused
        ? { ink: Number(svg.getAttribute('width') ?? 0) * abcScale, box: availPx }
        : undefined,
    );

    /*
     * **Ghi lại CẢ tỉ lệ của abcjs**, vì abcjs cài tuỳ chọn `scale` bằng chính
     * `style.transform` này. Chỉ ghi phép dịch là xoá luôn tỉ lệ ấy và bản nhạc
     * bị vẽ nhỏ đi một nửa mà không có lỗi nào báo ra. Gốc toạ độ để `0 0` cho
     * khớp với abcjs, không thì ảnh còn xê ngang.
     */
    svg.style.transformOrigin = '0 0';
    svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${abcScale * scale})`;
  }, [paperRef, boxRef, beatRef, question, grandStaff, focused, boxSize, paintCursor]);

  return { paintCursor };
}
