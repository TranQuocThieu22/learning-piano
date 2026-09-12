'use client';

import { Card, Group, Slider, Stack, Switch, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconMusic } from '@tabler/icons-react';
import { PIECES } from '@/lib/ambient';
import { saveAmbientSettings, useAmbientSettings } from '@/hooks/useAmbientSettings';

/**
 * Thẻ bật/tắt nhạc nền ở màn hình chủ.
 *
 * Tiếng do `AmbientMusic.tsx` phát (nằm ở layout gốc để nhạc không đứt khi
 * chuyển trang); ở đây chỉ ghi cài đặt xuống kho nhớ chung, và kho tự báo cho bộ
 * phát — xem `useAmbientSettings.ts`. Rẻ hơn nhiều so với dựng một context xuyên
 * cả app cho đúng một cái công tắc.
 *
 * Mặc định BẬT từ 11/09/2026 (xem `AMBIENT_DEFAULT` trong `ambient.ts` để biết vì
 * sao và vì sao việc đó không phá ràng buộc của `AGENTS.md`). Gạt tắt thì app nhớ,
 * lần mở sau không tự kêu lại — đó mới là chỗ quyền quyết định nằm ở người học.
 *
 * Có ba bài để chọn (thêm 11/09/2026, trước đó chỉ một bài). Chỗ chọn bài chỉ hiện
 * khi nhạc đang bật: đang tắt mà bày ra ba lựa chọn thì thẻ này dài ra vì một thứ
 * chưa dùng tới. Cả ba đều ở Đô trưởng — lý do ghi ở `AmbientPiece` trong
 * `ambient.ts`, và đó là ràng buộc của giáo trình chứ không phải lười.
 */
export function AmbientControl() {
  const settings = useAmbientSettings();

  const luu = (next: typeof settings) => saveAmbientSettings(next);

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon variant="light" color="grape" size={40} radius="md">
              <IconMusic size={22} />
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={600}>Nhạc nền</Text>
              <Text size="xs" c="dimmed">
                Tự im khi bạn nghe bản nhạc mẫu hoặc tập với đàn.
              </Text>
            </div>
          </Group>
          <Switch
            checked={settings.on}
            onChange={(e) => luu({ ...settings, on: e.currentTarget.checked })}
            aria-label="Bật nhạc nền"
            size="md"
          />
        </Group>

        {settings.on && (
          <>
            <Slider
              value={Math.round(settings.volume * 100)}
              onChange={(v) => luu({ ...settings, volume: v / 100 })}
              min={0}
              max={100}
              step={5}
              label={(v) => `${v}%`}
              aria-label="Âm lượng nhạc nền"
              mt="xs"
            />

            {/*
              Ba bài xếp dọc, mỗi bài một nút cao 44px trở lên — máy đang nằm trên
              giá nhạc cách mắt nửa sải tay, tay vừa rời phím đàn, nên nút phải to
              và bấm trúng ngay. Xếp ngang ba ô trên máy 360px thì mỗi ô còn chưa
              tới 110px, không đủ chỗ cho cả tên bài lẫn dòng tả.

              Dùng `UnstyledButton` chứ không phải `SegmentedControl`: cần hai dòng
              chữ trong một lựa chọn, mà `SegmentedControl` chỉ hợp với nhãn một
              dòng ngắn.
            */}
            <Stack gap={6} mt="xs" role="radiogroup" aria-label="Chọn bài nhạc nền">
              {PIECES.map((piece) => {
                const dangChon = settings.piece === piece.id;
                return (
                  <UnstyledButton
                    key={piece.id}
                    role="radio"
                    aria-checked={dangChon}
                    onClick={() => luu({ ...settings, piece: piece.id })}
                    className="ambient-piece"
                    data-selected={dangChon || undefined}
                  >
                    <Text size="sm" fw={dangChon ? 700 : 500}>
                      {piece.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {piece.hint}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
