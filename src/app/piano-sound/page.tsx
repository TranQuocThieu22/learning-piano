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

            <Title order={4} mt="md">Tắt tiếng của chính cây đàn</Title>
            <Text size="sm">
              Điện thoại và đàn cùng kêu thì nghe ra hai tiếng lệch nhau. Cắm dây xong, đánh thử
              một phím rồi xem tiếng app ra ở đâu:
            </Text>
            <Text size="sm">
              <b>Tiếng app ra loa đàn.</b> Đàn đang làm luôn card âm thanh cho điện thoại (Roland
              FP-30X là vậy), nên vặn nhỏ loa đàn là mất cả tiếng app. Tắt <b>Local Control</b>{' '}
              ngay trên đàn — tìm mục này trong sách hướng dẫn của đàn. Đàn thôi tự kêu khi bấm
              phím, loa đàn chỉ còn phát tiếng app. Tắt nguồn đàn thường phải tắt lại.
            </Text>
            <Text size="sm">
              <b>Tiếng app ra loa điện thoại.</b> Đàn chỉ gửi nốt sang, không nhận tiếng về. Vặn
              nhỏ loa đàn hết cỡ là xong — đàn vẫn gửi đủ nốt và lực bấm.
            </Text>
            <Text size="sm">
              <b>Nút <i>Tắt loa đàn</i></b> gửi lệnh Local Control qua dây, khỏi mò cài đặt. Chỉ một
              số đàn nhận: đàn Yamaha thường nhận, Roland và Kawai thì không — bấm mà đàn vẫn kêu
              thì làm theo một trong hai cách trên.
            </Text>

            <Title order={4} mt="md">Tiếng ra chậm là gì</Title>
            <Text size="sm">
              Là khoảng thời gian điện thoại cần để đưa tiếng ra loa hoặc tai nghe. Số này chưa tính
              đường nối từ đàn sang: dây gần như tức thì, Bluetooth thêm khoảng 15-40ms. Dưới 30ms
              thì tai không nhận ra; trên 50ms thì đánh nhanh sẽ thấy tiếng chạy sau tay. Tai nghe{' '}
              <b>có dây</b> thường nhanh hơn loa ngoài điện thoại, còn tai nghe hay loa Bluetooth
              thì chậm hơn hẳn.
            </Text>
            <Text size="sm">
              <b>Số lên hơn 100ms</b> thì gần như chắc là điện thoại vẫn đang nối với một tai nghe
              hay loa Bluetooth, dù bạn không đeo. Tắt kết nối đó là tiếng ra nhanh lại.
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
