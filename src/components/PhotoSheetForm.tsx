'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Progress, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconCamera } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { MAX_PAGES_PER_SHEET } from '@/lib/user-sheets';

/**
 * Chụp bản nhạc giấy thành một bản nhạc trong kho riêng — "giá nhạc số".
 *
 * **App không đọc được nốt từ ảnh, và nói thẳng điều đó.** Nhận dạng nốt từ ảnh
 * chụp điện thoại (giấy cong, bóng đèn, chụp nghiêng) sai thường xuyên, mà sai một
 * nốt thì người học tập sai cả câu và **không ai báo cho họ** — họ chỉ tưởng tai
 * mình có vấn đề, đúng chuyện đã xảy ra với Für Elise (bẫy 25). Thà nói rõ đây chỉ
 * là chỗ để đọc, còn hơn hứa một thứ máy làm không nổi.
 *
 * Đổi lại, đây là đường DUY NHẤT chạy trên iPhone mà không cần gì thêm, và là
 * đường duy nhất dùng được với sách giấy người học đang có trong tay.
 */
export function PhotoSheetForm({
  signedIn,
  sheetId,
  compact = false,
}: {
  signedIn: boolean;
  /** Có sẵn nghĩa là chụp THÊM trang cho bản nhạc cũ, không mở bản nhạc mới. */
  sheetId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = usePhotoUpload();
  const [title, setTitle] = useState('');

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const chosen = [...files].slice(0, MAX_PAGES_PER_SHEET);
    const id = await upload.upload(chosen, {
      title: title.trim() || 'Bản nhạc chụp ảnh',
      sheetId,
    });
    if (id) {
      router.push(`/my-sheets/${id}`);
      router.refresh();
    }
  }

  return (
    <Stack gap="sm">
      {!compact && (
        <TextInput
          label="Tên bản nhạc"
          placeholder="Ví dụ: Bài 12 trong sách đỏ"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          maxLength={120}
          disabled={!signedIn}
        />
      )}

      {/*
        `capture="environment"` mở thẳng camera sau trên điện thoại, nhưng người
        học vẫn chọn được ảnh có sẵn trong máy — chụp trước rồi cắt cho ngay ngắn
        là cách nhiều người làm, và không nên chặn họ.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = '';
        }}
      />

      <Button
        onClick={() => inputRef.current?.click()}
        leftSection={<IconCamera size={20} />}
        size="md"
        variant="light"
        color="grape"
        disabled={!signedIn || upload.busy}
      >
        {sheetId ? 'Chụp thêm trang' : 'Chụp hoặc chọn ảnh bản nhạc'}
      </Button>

      {upload.busy && (
        <>
          <Text size="sm">
            Đang gửi trang {upload.done + 1}/{upload.total}…
          </Text>
          <Progress
            value={upload.total === 0 ? 0 : (upload.done / upload.total) * 100}
            size="sm"
            radius="xl"
            color="grape"
            aria-label="Tiến độ gửi ảnh"
          />
        </>
      )}

      {upload.error && (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
          <Text size="sm">{upload.error}</Text>
        </Alert>
      )}

      {!compact && (
        <Text size="xs" c="dimmed">
          Ảnh chỉ mình bạn xem được. App không đọc nốt từ ảnh nên phần nghe mẫu và tập với đàn
          không dùng được ở đây — bản nhạc chụp ảnh là để đọc trên giá nhạc, thay cho việc lật
          giấy khi hai tay đang bận. Tối đa {MAX_PAGES_PER_SHEET} trang một bản.
        </Text>
      )}
    </Stack>
  );
}
