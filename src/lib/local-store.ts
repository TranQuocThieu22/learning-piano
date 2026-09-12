/**
 * Kho nhớ nhỏ trên `localStorage`, dùng chung cho mọi lựa chọn cần nhớ giữa hai
 * buổi tập: mức bài luyện nhận nốt, mức luyện tai, thanh điều hướng thu hay mở,
 * nhạc nền, nhạc cụ đang chọn.
 *
 * **Vì sao phải có file này thay vì mỗi chỗ tự viết**: bốn chỗ trong repo đã
 * chép đi chép lại đúng một khuôn — một `Set` người nghe, một biến nhớ tạm,
 * `getSnapshot` / `getServerSnapshot` / `subscribe`, và một hàm ghi. Chép tay
 * thì mỗi bản lại quên một chi tiết khác nhau, mà ba chi tiết dưới đây quên cái
 * nào cũng ra lỗi khó truy:
 *
 * 1. **Phải qua `useSyncExternalStore`, không đọc thẳng lúc dựng state.** Máy
 *    chủ không có `localStorage`, nên đọc thẳng là HTML của máy chủ khác HTML
 *    của máy người học và React báo lệch hydration. Đọc trong `useEffect` cũng
 *    không xong: đó là `setState` thẳng trong effect, thứ quy tắc lint của repo
 *    cấm, và còn vẽ thừa một lần.
 * 2. **Phải trả về CÙNG MỘT đối tượng khi dữ liệu không đổi.** Tham chiếu mới
 *    mỗi lần gọi là React vẽ lại vô tận. Nên ở đây so **chuỗi thô** rồi mới
 *    `parse`, chứ không so từng trường.
 * 3. **Mọi lần chạm vào `localStorage` đều phải bọc `try`.** Chế độ riêng tư
 *    chặn cả đọc lẫn ghi, và dữ liệu cũ sai dạng sau khi đổi mã là chuyện
 *    thường. Hỏng thì lùi về mặc định, tuyệt đối không ném lỗi làm vỡ giao diện.
 *
 * Kho nhận dữ liệu đã lưu như **dữ liệu lạ**: người dùng sửa tay được, và bản
 * lưu từ phiên bản cũ của app còn sót lại. `parse` cứ ném lỗi thoải mái, kho bắt
 * hết và trả mặc định.
 */

/**
 * Phần của trình duyệt mà kho cần: đọc, ghi, và nghe thông báo có thay đổi.
 *
 * Tách ra thành tham số để chạy được trong vitest (`environment: 'node'`, không
 * có `window`) — cùng lối với `env-schema.ts` / `env.ts` trong `AGENTS.md`.
 */
export interface StoreHost {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  addEventListener(type: string, onEvent: () => void): void;
  removeEventListener(type: string, onEvent: () => void): void;
}

/**
 * Trình duyệt thật. Trả `null` khi đang chạy ở máy chủ.
 *
 * Phải gọi **mỗi lần dùng**, không được chốt một lần lúc dựng kho: component
 * dùng kho vẫn được nạp ở máy chủ lúc dựng HTML, chốt lúc đó thì sau khi sang
 * máy người học kho vẫn tưởng mình không có trình duyệt.
 */
function browserHost(): StoreHost | null {
  if (typeof window === 'undefined') return null;
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    addEventListener: (type, onEvent) => window.addEventListener(type, onEvent),
    removeEventListener: (type, onEvent) => window.removeEventListener(type, onEvent),
  };
}

export interface LocalStoreSpec<T> {
  /** Khoá lưu. Đổi là người học mất thứ đang chọn, nên đừng đổi. */
  key: string;
  /** Giá trị khi chưa lưu gì, khi bản lưu hỏng, và khi đang dựng ở máy chủ. */
  fallback: T;
  /** Đọc chuỗi đã lưu. Cứ ném lỗi nếu thấy sai dạng — kho bắt và lùi về mặc định. */
  parse: (raw: string) => T;
  /** Viết ra chuỗi để lưu. Mặc định là `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** Đổi trình duyệt giả để test. Bỏ trống là dùng trình duyệt thật. */
  host?: () => StoreHost | null;
}

export interface LocalStore<T> {
  /** Giá trị đang lưu. Cùng một đối tượng cho tới khi chuỗi thô đổi. */
  getSnapshot(): T;
  /** Ảnh chụp của máy chủ — luôn là mặc định, nên lần vẽ đầu hai bên giống hệt nhau. */
  getServerSnapshot(): T;
  subscribe(onChange: () => void): () => void;
  /** Ghi giá trị mới rồi báo cho mọi nơi đang đọc. Không lưu được thì vẫn báo. */
  save(value: T): void;
}

export function createLocalStore<T>(spec: LocalStoreSpec<T>): LocalStore<T> {
  const {
    key, fallback, parse, serialize = JSON.stringify, host = browserHost,
  } = spec;

  const listeners = new Set<() => void>();
  /** `undefined` nghĩa là chưa đọc lần nào — khác hẳn `null` (đã đọc, chưa lưu gì). */
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;
  /**
   * Bật khi trình duyệt từ chối ghi (chế độ riêng tư).
   *
   * Lúc đó phải giữ giá trị trong bộ nhớ và **thôi đọc lại** `localStorage`:
   * đọc lại chỉ thấy chỗ trống, rồi lùi về mặc định ngay sau khi người học vừa
   * chọn — nhìn ra ngoài đúng bằng "bấm vào không ăn".
   */
  let memoryOnly = false;

  function readRaw(): string | null {
    const browser = host();
    if (!browser) return null;
    try {
      return browser.getItem(key);
    } catch {
      // Chế độ riêng tư chặn đọc: coi như chưa lưu gì.
      return null;
    }
  }

  function getSnapshot(): T {
    if (memoryOnly) return cachedValue;
    const raw = readRaw();
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    cachedValue = fallback;
    if (raw !== null) {
      try {
        cachedValue = parse(raw);
      } catch {
        // Bản lưu hỏng hoặc còn sót từ phiên bản cũ: lùi về mặc định.
      }
    }
    return cachedValue;
  }

  function getServerSnapshot(): T {
    return fallback;
  }

  /**
   * Nghe cả sự kiện `storage` để hai tab mở cùng lúc không đá nhau.
   *
   * Sự kiện `storage` của tab khác nổ cho MỌI khoá, nhưng không sao: kho so
   * chuỗi thô trước, khoá khác đổi thì `getSnapshot` trả về đúng đối tượng cũ
   * và React không vẽ lại gì.
   */
  function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    const browser = host();
    browser?.addEventListener('storage', onChange);
    return () => {
      listeners.delete(onChange);
      browser?.removeEventListener('storage', onChange);
    };
  }

  function save(value: T): void {
    const raw = serialize(value);
    cachedRaw = raw;
    cachedValue = value;
    const browser = host();
    try {
      browser?.setItem(key, raw);
    } catch {
      // Không lưu được thì buổi tập này vẫn theo lựa chọn mới, chỉ là lần mở
      // sau không nhớ. Không đáng để báo lỗi cho người học.
      memoryOnly = true;
    }
    for (const onChange of listeners) onChange();
  }

  return { getSnapshot, getServerSnapshot, subscribe, save };
}
