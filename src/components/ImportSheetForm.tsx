'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconFileMusic, IconDeviceFloppy } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { SheetViewer } from './SheetViewer';
import { importSheetFile } from '@/lib/import-sheet';
import { saveImportedSheet } from '@/lib/sheet-actions';
import { sheetErrorMessage, sheetSource, type SheetSource } from '@/lib/user-sheets';

/**
 * Nhập một file `.mid` hoặc `.musicxml` thành bản nhạc trong kho riêng.
 *
 * **File được đọc ngay tại máy người học**, không gửi lên máy chủ: `importSheetFile`
 * là hàm thuần nên chạy được cả hai bên, và chạy ở đây thì người học thấy bản nhạc
 * hiện ra trước khi quyết định lưu — file hỏng hay file nhầm thì biết ngay trong
 * một giây, không phải chờ tải lên.
 *
 * **Xem trước rồi mới lưu, cố ý.** Máy phải đoán vài thứ khi đọc file MIDI (hai
 * tay, trường độ), nên bắt buộc phải có một bước người học nhìn bằng mắt rồi mới
 * gật — chứ không phải lưu xong mới phát hiện bản nhạc không giống bài mình định
 * tập.
 */
export function ImportSheetForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<{ abc: string; source: SheetSource } | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onPick(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const sheet = importSheetFile(file.name, bytes);
      setPreview({ abc: sheet.abc, source: sheet.source });
      setTitle(sheet.title);
    } catch (e) {
      setPreview(null);
      // Mọi lỗi đọc file đều đã mang sẵn câu tiếng Việt nói rõ phải làm gì
      // (`ImportedScoreError`); chỉ lỗi ngoài dự tính mới rơi xuống câu chung.
      setError(e instanceof Error ? e.message : 'File này app chưa đọc được.');
    }
  }

  async function onSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    const result = await saveImportedSheet({ title, abc: preview.abc, source: preview.source });
    setSaving(false);

    if (!result.ok || !result.id) {
      setError(sheetErrorMessage(result.error));
      return;
    }
    router.push(`/my-sheets/${result.id}`);
    router.refresh();
  }

  return (
    <Stack gap="sm">
      {/*
        Input thật bị giấu đi và mở bằng nút Mantine: input file mặc định của
        trình duyệt trên Android hiện thành một nút xám bé tí, mà lúc tập thì máy
        đang ở trên giá nhạc cách mắt nửa sải tay.
      */}
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi,.musicxml,.xml"
        hidden
        onChange={(e) => {
          void onPick(e.target.files?.[0] ?? null);
          // Xoá giá trị để chọn lại ĐÚNG file vừa chọn cũng phát ra sự kiện —
          // không có dòng này thì thử lại sau khi sửa file là không có gì xảy ra.
          e.target.value = '';
        }}
      />

      <Button
        onClick={() => inputRef.current?.click()}
        leftSection={<IconFileMusic size={20} />}
        size="md"
        variant="light"
        disabled={!signedIn}
      >
        Chọn file .mid hoặc .musicxml
      </Button>

      {!signedIn && (
        <Text size="sm" c="dimmed">
          Đăng nhập ở Trang chủ trước đã — kho nhạc gắn với tài khoản của bạn.
        </Text>
      )}

      {error && (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {preview && (
        <>
          <TextInput
            label="Tên bản nhạc"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={120}
          />

          <SheetViewer abcNotation={preview.abc} />

          {/*
            Nói thẳng chỗ máy phải đoán, ngay dưới bản nhạc vừa vẽ. Giấu đi thì
            người học tưởng bản nhạc sai là do họ chọn nhầm file.
          */}
          <Text size="xs" c="dimmed">
            {sheetSource(preview.source)?.note}
            {preview.source === 'midi'
              && ' Máy chia hai tay theo Đô giữa và làm tròn trường độ, nên bản nhạc có thể khác bản in đôi chút.'}
          </Text>

          <Group gap="sm">
            <Button
              onClick={() => void onSave()}
              loading={saving}
              disabled={!signedIn || title.trim().length === 0}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Lưu vào kho của tôi
            </Button>
            <Button variant="default" onClick={() => { setPreview(null); setError(null); }}>
              Bỏ, chọn file khác
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
