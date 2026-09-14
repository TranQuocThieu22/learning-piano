'use client';

import { useMemo, useRef, useState } from 'react';
import { Alert, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconFileMusic, IconDeviceFloppy } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { SheetViewer } from './SheetViewer';
import { importSheetFile, sheetAbc } from '@/lib/import-sheet';
import { findKey, KEYS_BY_FIFTHS } from '@/lib/midi-notes';
import type { ImportedScore } from '@/lib/imported-score';
import { saveImportedSheet } from '@/lib/sheet-actions';
import { sheetErrorMessage, sheetSource, type SheetSource } from '@/lib/user-sheets';

/**
 * Nhập một file `.mid`, `.musicxml` hoặc `.mxl` thành bản nhạc trong kho riêng.
 *
 * **File được đọc ngay tại máy người học**, không gửi lên máy chủ: `importSheetFile`
 * là hàm thuần nên chạy được cả hai bên, và chạy ở đây thì người học thấy bản nhạc
 * hiện ra trước khi quyết định lưu — file hỏng hay file nhầm thì biết ngay trong
 * một giây, không phải chờ tải lên. File `.mxl` cũng được giải nén ngay tại đây,
 * vì trên điện thoại người học không có cách nào tự giải nén.
 *
 * **Xem trước rồi mới lưu, cố ý.** Máy phải đoán vài thứ khi đọc file MIDI (hai
 * tay, trường độ), nên bắt buộc phải có một bước người học nhìn bằng mắt rồi mới
 * gật — chứ không phải lưu xong mới phát hiện bản nhạc không giống bài mình định
 * tập.
 *
 * **Hoá biểu chọn được ngay ở bước xem trước.** File MIDI hiếm khi khai giọng, mà
 * không có hoá biểu thì bản nhạc nhiều phím đen hiện ra dày đặc dấu thăng giáng —
 * đọc trên điện thoại đặt ở giá nhạc gần như không nổi. Đổi hoá biểu chỉ đổi cách
 * VIẾT, không đổi nốt nào vang ra (xem `toAbc`), nên đây là ô chọn an toàn: thử
 * tới lúc nhìn thuận mắt rồi mới lưu.
 */
export function ImportSheetForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<{ score: ImportedScore; source: SheetSource } | null>(null);
  const [keyId, setKeyId] = useState('C');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /*
   * Ghi lại cả chuỗi ABC mỗi lần đổi hoá biểu, và chỉ khi đó: bản nhạc dài 400 ô
   * nhịp thì đây là việc nặng nhất của cả trang, mà gõ tên bài lại làm trang vẽ
   * lại liên tục.
   */
  const abc = useMemo(() => {
    if (!preview) return null;
    try {
      return { text: sheetAbc(preview.score, findKey(keyId)), error: null };
    } catch (e) {
      return { text: null, error: e instanceof Error ? e.message : 'Bản nhạc này app chưa ghi được.' };
    }
  }, [preview, keyId]);

  async function onPick(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const sheet = await importSheetFile(file.name, bytes);
      setPreview({ score: sheet.score, source: sheet.source });
      setKeyId(sheet.key.id);
      setTitle(sheet.title);
    } catch (e) {
      setPreview(null);
      // Mọi lỗi đọc file đều đã mang sẵn câu tiếng Việt nói rõ phải làm gì
      // (`ImportedScoreError`); chỉ lỗi ngoài dự tính mới rơi xuống câu chung.
      setError(e instanceof Error ? e.message : 'File này app chưa đọc được.');
    }
  }

  async function onSave() {
    if (!preview || !abc?.text) return;
    setSaving(true);
    setError(null);
    const result = await saveImportedSheet({ title, abc: abc.text, source: preview.source });
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
        accept=".mid,.midi,.musicxml,.xml,.mxl"
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
        Chọn file .mid, .mxl hoặc .musicxml
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

          {/*
            Ô chọn hoá biểu đứng NGAY TRÊN bản nhạc: đổi một dòng rồi nhìn ngay
            xuống thấy dấu hoá thưa hẳn ra, không phải cuộn đi tìm.
          */}
          <Select
            label="Hoá biểu đầu khuông"
            description="Chọn đúng giọng của bài thì dấu hoá cạnh nốt thưa hẳn. Nốt vang ra không đổi."
            data={KEYS_BY_FIFTHS.map((k) => ({ value: k.id, label: k.label }))}
            value={keyId}
            onChange={(value) => setKeyId(value ?? 'C')}
            allowDeselect={false}
          />

          {abc?.text && <SheetViewer abcNotation={abc.text} />}

          {abc?.error && (
            <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
              <Text size="sm">{abc.error}</Text>
            </Alert>
          )}

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
              disabled={!signedIn || title.trim().length === 0 || !abc?.text}
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
