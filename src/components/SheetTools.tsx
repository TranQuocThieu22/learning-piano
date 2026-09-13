'use client';

import { useState } from 'react';
import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconCheck, IconPencil, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { deleteSheet, renameSheet } from '@/lib/sheet-actions';
import { sheetErrorMessage } from '@/lib/user-sheets';

/**
 * Đổi tên và xoá một bản nhạc trong kho riêng.
 *
 * **Nút xoá phải luôn ở đây, không giấu sau menu.** Người học gỡ được ngay thứ họ
 * đưa lên là một trong bốn điều giữ app ở vị trí nơi chứa chứ không phải người
 * phát hành (xem `src/lib/user-sheets.ts`) — một cái nút phải nhắn tin xin mới gỡ
 * được thì điều đó chỉ đúng trên giấy.
 *
 * Hỏi lại một lần trước khi xoá, bằng cách đổi chính cái nút thành *Xoá thật chứ?*
 * chứ không mở hộp thoại: hộp thoại trên điện thoại hay bị bàn phím ảo che mất, và
 * một cú chạm nhầm ở đây là mất hẳn bản nhạc người học đã ngồi chụp từng trang.
 */
export function SheetTools({ sheetId, title }: { sheetId: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(title);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRename() {
    setBusy(true);
    setError(null);
    const result = await renameSheet({ sheetId, title: name });
    setBusy(false);
    if (!result.ok) {
      setError(sheetErrorMessage(result.error));
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function onDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteSheet(sheetId);
    setBusy(false);
    if (!result.ok) {
      setError(sheetErrorMessage(result.error));
      return;
    }
    router.push('/my-sheets');
    router.refresh();
  }

  return (
    <Stack gap="sm" mt="xl">
      {editing && (
        <Group gap="sm" wrap="nowrap">
          <TextInput
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            maxLength={120}
            style={{ flex: 1 }}
            aria-label="Tên bản nhạc"
          />
          <Button
            onClick={() => void onRename()}
            loading={busy}
            disabled={name.trim().length === 0}
            leftSection={<IconCheck size={18} />}
          >
            Lưu
          </Button>
        </Group>
      )}

      <Group gap="sm">
        {!editing && (
          <Button
            variant="default"
            onClick={() => { setName(title); setEditing(true); }}
            leftSection={<IconPencil size={18} />}
          >
            Đổi tên
          </Button>
        )}
        <Button
          variant={confirming ? 'filled' : 'subtle'}
          color="red"
          loading={busy}
          leftSection={<IconTrash size={18} />}
          onClick={() => (confirming ? void onDelete() : setConfirming(true))}
        >
          {confirming ? 'Xoá thật chứ?' : 'Xoá khỏi kho'}
        </Button>
        {confirming && (
          <Button variant="default" onClick={() => setConfirming(false)}>
            Thôi
          </Button>
        )}
      </Group>

      {error && (
        <Alert color="orange" variant="light">
          <Text size="sm">{error}</Text>
        </Alert>
      )}
    </Stack>
  );
}
