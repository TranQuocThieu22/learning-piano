'use client';

import { Card, Group, Slider, Stack, Switch, Text } from '@mantine/core';
import { IconMusic } from '@tabler/icons-react';
import { saveAmbientSettings, useAmbientSettings } from '@/hooks/useAmbientSettings';

/**
 * Thẻ bật/tắt nhạc nền ở màn hình chủ.
 *
 * Tiếng do `AmbientMusic.tsx` phát (nằm ở layout gốc để nhạc không đứt khi
 * chuyển trang); ở đây chỉ ghi cài đặt xuống localStorage rồi bắn một sự kiện —
 * xem `useAmbientSettings.ts`. Rẻ hơn nhiều so với dựng một context xuyên cả app
 * cho đúng một cái công tắc.
 *
 * Mặc định TẮT, và không có nút nào tự bật hộ: `AGENTS.md` chốt rằng người học
 * tự quyết khi nào bắt đầu và dừng. Nhạc tự kêu lên lúc mở app là ngược lại.
 */
export function AmbientControl() {
  const settings = useAmbientSettings();

  const luu = (next: typeof settings) => saveAmbientSettings(next);

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <IconMusic size={24} color="var(--mantine-color-violet-6)" />
            <div style={{ minWidth: 0 }}>
              <Text fw={600}>Nhạc nền</Text>
              <Text size="xs" c="dimmed">
                Tự tắt khi bạn vào bài học hay bật máy đánh nhịp.
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
        )}
      </Stack>
    </Card>
  );
}
