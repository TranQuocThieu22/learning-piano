'use client';

import type { ReactNode } from 'react';
import {
  Alert, Box, Button, Card, Group, Progress, Select, Stack, Text,
} from '@mantine/core';
import { IconMicrophone, IconUsb } from '@tabler/icons-react';
import type { PianoInput } from '@/hooks/usePianoInput';
import { describeMidiNote } from '@/lib/midi-notes';

/**
 * Giao diện chung cho hai chỗ app nghe người học đánh đàn: bài luyện nhận nốt và
 * phần "Tập bài này với đàn" dưới mỗi bản nhạc.
 *
 * Micro đứng trước, MIDI đứng sau — đúng thứ tự người học có: ai cũng có micro
 * trên điện thoại, chỉ một phần có dây và đàn có cổng cắm (xem AGENTS.md, mục
 * điện thoại là thiết bị chính).
 */

/** Câu hứa về quyền riêng tư, hiện ngay cạnh nút bật micro. */
const PRIVACY_NOTE = 'Âm thanh chỉ được xử lý ngay trên máy này để nhận ra nốt bạn đánh — không ghi âm, không lưu, không gửi đi đâu.';

export function PianoInputChooser({
  input,
  title,
  description,
}: {
  input: PianoInput;
  title: string;
  description: ReactNode;
}) {
  return (
    <Card withBorder padding="md" data-testid="input-chooser">
      <Stack gap="sm">
        <Box>
          <Text fw={500}>{title}</Text>
          <Text size="sm" c="dimmed">{description}</Text>
        </Box>
        <Group gap="sm" wrap="wrap">
          <Button
            leftSection={<IconMicrophone size={18} />}
            onClick={input.chooseMic}
            data-testid="choose-mic"
          >
            Nghe qua micro
          </Button>
          {input.midiSupported && (
            <Button
              variant="default"
              leftSection={<IconUsb size={18} />}
              onClick={input.chooseMidi}
              data-testid="choose-midi"
            >
              Nối MIDI
            </Button>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          Micro: đặt máy trên giá nhạc rồi đánh, không cần mua gì thêm. {PRIVACY_NOTE}
        </Text>
        {input.midiSupported && (
          <Text size="xs" c="dimmed">
            MIDI: chính xác tuyệt đối, dành cho đàn có cổng USB hoặc có Bluetooth — nối
            Bluetooth thì không cần dây, cắm dây thì cần cáp OTG. Cả hai đường đều chạy trên
            Android và máy tính.
          </Text>
        )}
      </Stack>
    </Card>
  );
}

/**
 * Trạng thái của cách nối đang dùng: đang xin quyền, lỗi, hay đã nghe được.
 * `children` là phần điều khiển riêng của từng chỗ dùng, hiện khi đã sẵn sàng.
 */
export function PianoInputStatus({ input, children }: { input: PianoInput; children?: ReactNode }) {
  const switchButton = (
    <Button variant="subtle" color="gray" size="xs" onClick={input.reset} data-testid="switch-input">
      Đổi cách nối
    </Button>
  );

  if (input.mode === 'mic') return <MicStatus input={input} switchButton={switchButton}>{children}</MicStatus>;
  if (input.mode === 'midi') return <MidiStatus input={input} switchButton={switchButton}>{children}</MidiStatus>;
  return null;
}

function MicStatus({ input, switchButton, children }: { input: PianoInput; switchButton: ReactNode; children?: ReactNode }) {
  const { status, errorMessage, level, lastHeard } = input.mic;

  if (status === 'idle' || status === 'connecting') {
    return (
      <Card withBorder padding="md">
        <Text size="sm">Đang chờ bạn cho phép dùng micro…</Text>
        <Text size="xs" c="dimmed" mt={4}>{PRIVACY_NOTE}</Text>
      </Card>
    );
  }

  if (status !== 'ready') {
    const problem = MIC_PROBLEMS[status];
    return (
      <Alert color={status === 'denied' ? 'red' : 'orange'} title={problem.title} data-testid="mic-problem">
        <Text size="sm" mb="xs">
          {problem.body}
          {status === 'error' && errorMessage ? ` Thông báo từ trình duyệt: ${errorMessage}` : ''}
        </Text>
        <Group gap="xs">
          {problem.retry && <Button size="xs" onClick={input.chooseMic}>Thử lại</Button>}
          {switchButton}
        </Group>
      </Alert>
    );
  }

  return (
    <Card withBorder padding="md" data-testid="mic-ready">
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            <IconMicrophone size={16} />
            <Text size="sm" fw={500}>Micro đang nghe</Text>
          </Group>
          {/* Không có vạch nào nhúc nhích thì người học biết ngay micro không thu được gì. */}
          <Progress value={level * 100} size="sm" mt={6} animated={false} aria-label="Mức âm thanh micro đang thu" />
        </Box>
        <Box ta="right" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed">Vừa nghe</Text>
          <Text size="sm" fw={500} data-testid="mic-last-heard">
            {lastHeard && lastHeard.length > 0 ? lastHeard.map(describeMidiNote).join(', ') : '—'}
          </Text>
        </Box>
      </Group>
      <Text size="xs" c="dimmed" mt="xs">
        Đặt máy gần đàn, phòng càng yên càng tốt. Máy nghe nhầm thì cứ đánh lại — không trừ gì cả.
      </Text>
      {children}
      <Group justify="flex-end" mt="xs">{switchButton}</Group>
    </Card>
  );
}

const MIC_PROBLEMS: Record<Exclude<PianoInput['mic']['status'], 'ready' | 'idle' | 'connecting'>, { title: string; body: string; retry: boolean }> = {
  denied: {
    title: 'Chưa được phép dùng micro',
    body: 'Trình duyệt đang chặn micro cho trang này. Bấm vào biểu tượng ổ khoá cạnh thanh địa chỉ (hoặc vào Cài đặt của điện thoại, mục trình duyệt đang dùng), cho phép Micro, rồi bấm Thử lại.',
    retry: true,
  },
  'no-mic': {
    title: 'Không mở được micro',
    body: 'Máy không có micro, hoặc micro đang bị ứng dụng khác dùng (đang gọi điện, đang ghi âm). Tắt ứng dụng đó rồi thử lại.',
    retry: true,
  },
  unsupported: {
    title: 'Trình duyệt này không cho dùng micro',
    body: 'Thử mở trang bằng Safari hoặc Chrome bản mới. Bạn vẫn học đủ mọi bài bình thường — phần nghe đàn chỉ là hỗ trợ thêm.',
    retry: false,
  },
  insecure: {
    title: 'Trang chưa chạy trên https',
    body: 'Trình duyệt chỉ cho dùng micro trên trang bảo mật. Hãy mở bằng địa chỉ chính thức pianojourney.rehover.io.',
    retry: false,
  },
  error: {
    title: 'Không bật được micro',
    body: 'Có lỗi khi mở micro.',
    retry: true,
  },
};

function MidiStatus({ input, switchButton, children }: { input: PianoInput; switchButton: ReactNode; children?: ReactNode }) {
  const { status, errorMessage, devices, selectedDeviceId, selectDevice, heldNotes } = input.midi;

  if (status === 'unsupported') {
    return (
      <Alert color="orange" title="Máy này chưa nối MIDI được">
        <Text size="sm" mb="xs">
          Nối MIDI — cả bằng dây lẫn bằng Bluetooth — chạy trên điện thoại Android (Chrome, Edge)
          và máy tính. iPhone và iPad chưa hỗ trợ, và đó là giới hạn của trình duyệt trên iOS chứ
          không phải của cây đàn — dùng micro là đủ.
        </Text>
        {switchButton}
      </Alert>
    );
  }

  if (status === 'denied') {
    return (
      <Alert color="red" title="Chưa kết nối được">
        <Text size="sm" mb="xs">
          Trình duyệt từ chối quyền dùng thiết bị MIDI. Thường là do bấm &quot;Chặn&quot; ở hộp thoại xin quyền.
          {errorMessage ? ` Thông báo từ trình duyệt: ${errorMessage}` : ''}
        </Text>
        <Group gap="xs">
          <Button size="xs" onClick={input.chooseMidi}>Thử lại</Button>
          {switchButton}
        </Group>
      </Alert>
    );
  }

  if (status !== 'ready') {
    return (
      <Card withBorder padding="md">
        <Text size="sm">Đang kết nối…</Text>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Alert color="yellow" title="Chưa thấy đàn nào">
        <Text size="sm" mb={4}>
          <b>Nối bằng dây:</b> kiểm tra dây USB (điện thoại cần cáp OTG) và bật nguồn đàn.
          Cắm vào là tự nhận, không cần tải lại trang.
        </Text>
        <Text size="sm" mb="xs">
          <b>Nối Bluetooth trên Android:</b> ghép đôi ở phần Cài đặt là <b>chưa đủ</b> — cách đó
          chỉ ra tiếng, không ra MIDI. Phải mở kết nối từ <b>app của hãng đàn</b> (đàn Roland thì
          dùng Roland Piano App), để app đó chạy nền, rồi quay lại đây bấm <i>Tìm lại đàn</i>.
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={input.midi.refresh} data-testid="midi-refresh">
            Tìm lại đàn
          </Button>
          {switchButton}
        </Group>
      </Alert>
    );
  }

  return (
    <Card withBorder padding="md" data-testid="midi-ready">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        {devices.length > 1 ? (
          <Select
            label="Đàn đang dùng"
            size="xs"
            data={devices.map((d) => ({ value: d.id, label: d.name }))}
            value={selectedDeviceId}
            onChange={(v) => v && selectDevice(v)}
            allowDeselect={false}
            w={220}
          />
        ) : (
          <Text size="sm" c="dimmed">
            Đàn: <b>{devices[0]?.name}</b>
          </Text>
        )}
        <Box ta="right">
          <Text size="xs" c="dimmed">Phím đang bấm</Text>
          <Text size="sm" fw={500} data-testid="held-notes">
            {heldNotes.length === 0 ? '—' : heldNotes.map(describeMidiNote).join(', ')}
          </Text>
        </Box>
      </Group>
      {children}
      <Group justify="flex-end" mt="xs">{switchButton}</Group>
    </Card>
  );
}
