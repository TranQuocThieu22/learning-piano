import { Card, Container, Stack, Text, Title } from '@mantine/core';
import { IconPiano } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { LivePianoPlayer } from '@/components/LivePianoPlayer';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Tiếng đàn qua điện thoại',
};

export default function PianoSoundPage() {
  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="trainer"
          icon={<IconPiano size={26} />}
          title="Tiếng đàn qua điện thoại"
          description="Nối đàn bằng dây MIDI hoặc Bluetooth, đánh trên đàn — điện thoại phát tiếng piano. Hợp khi loa của đàn nghe chưa hay, hoặc khi tập khuya bằng tai nghe."
        />

        <LivePianoPlayer />

        <Card withBorder padding="lg" mt="xl">
          <Stack gap="sm">
            <Title order={4}>Cần gì để chạy được</Title>
            <Text size="sm">
              <b>Đàn có cổng USB hoặc Bluetooth MIDI</b>, và điện thoại Android (Chrome hoặc Edge)
              hoặc máy tính. Cắm dây vào điện thoại thì cần cáp OTG. iPhone và iPad chưa làm được —
              trình duyệt trên iOS không cho nối MIDI bằng đường nào.
            </Text>
            <Text size="sm">
              <b>Vặn nhỏ loa của đàn.</b> Điện thoại và đàn cùng kêu thì nghe ra hai tiếng lệch nhau
              một chút. Cắm tai nghe vào điện thoại là gọn nhất.
            </Text>

            <Title order={4} mt="md">Độ trễ là gì</Title>
            <Text size="sm">
              Là khoảng thời gian từ lúc ngón tay chạm đáy phím tới lúc nghe ra tiếng. Dưới 30ms thì
              tai không nhận ra; trên 50ms thì đánh nhanh sẽ thấy tiếng chạy sau tay. Tai nghe{' '}
              <b>có dây</b> thường nhanh hơn loa ngoài, còn tai nghe Bluetooth thì chậm hơn hẳn.
            </Text>
            <Text size="sm" c="dimmed">
              Đây là công cụ hỗ trợ, không phải phần bắt buộc của giáo trình. Đàn của bạn đã có tiếng
              ổn thì cứ tập như bình thường.
            </Text>
          </Stack>
        </Card>
      </Container>
    </AppLayout>
  );
}
