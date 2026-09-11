import { Card, Container, Stack, Text, Title } from '@mantine/core';
import { IconMusicSearch } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { NoteRecognitionDrill } from '@/components/NoteRecognitionDrill';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Luyện nhận nốt',
};

export default async function NoteRecognitionPage() {
  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="trainer"
          icon={<IconMusicSearch size={26} />}
          title="Luyện nhận nốt"
          description="Màn hình hiện một nốt, bạn bấm phím tương ứng trên đàn thật — app nghe qua micro của điện thoại. Không đếm giờ, không chấm điểm khi đang chơi — cứ chậm bao nhiêu tùy bạn."
        />

        <NoteRecognitionDrill />

        <Card withBorder padding="lg" mt="xl">
        <Stack gap="sm">
          <Title order={4}>Vì sao bài này không chạy theo nhịp</Title>
          <Text size="sm">
            Bạn có thể đã gặp những ứng dụng cho bản nhạc trôi trên màn hình và chấm đúng sai ngay
            khi đang đánh. Với người mới, cách đó thường phản tác dụng: tay chưa quen phím, mắt còn
            đang dò nốt, mà nhạc đã trôi mất — càng cuống lại càng sai.
          </Text>
          <Text size="sm">
            Ở đây mỗi lần chỉ có <b>một nốt</b> và nó đứng yên cho tới khi bạn bấm đúng. Bấm sai cũng
            không sao, không mất điểm, không có tiếng báo lỗi. Mục tiêu là bạn <b>đọc được nốt</b>,
            không phải bạn phản xạ nhanh.
          </Text>

          <Title order={4} mt="md">Dùng sao cho hiệu quả</Title>
          <Text size="sm">
            <b>Mỗi lần 5 phút là đủ.</b> Đây là bài khởi động cho mắt, không phải phần chính của buổi
            tập. Tập lâu quá sẽ mệt mắt mà không thêm được gì.
          </Text>
          <Text size="sm">
            <b>Chọn đúng phần mình đang yếu.</b> Ba ô chọn ở trên ghép được nhiều kiểu bài: một quãng
            cho quen mặt chữ, hai ba quãng cách xa nhau để tập mắt nhảy, khóa Pha riêng cho tay trái,
            hoặc bật dấu hoá khi bắt đầu gặp phím đen trong bài. Chọn &quot;Cả hai tay&quot; thì mỗi câu
            đổi khóa nhạc — khó hơn hẳn, vì phải nhìn khóa trước rồi mới đọc nốt.
          </Text>
          <Text size="sm">
            <b>Đừng nhìn xuống tay.</b> Tìm phím bằng cảm giác, dựa vào cụm hai phím đen và ba phím
            đen làm mốc. Nếu buộc phải nhìn thì nhìn, nhưng hãy cố giảm dần.
          </Text>
          <Text size="sm">
            <b>Đọc bằng mốc, đừng đếm từ đầu khuông.</b> Nhớ vị trí nốt Đô giữa rồi đo lên xuống từ
            đó sẽ nhanh hơn nhiều so với đếm từng dòng mỗi lần.
          </Text>
          <Text size="sm">
            <b>Xem mục &quot;nốt hay nhầm nhất&quot;.</b> Nếu một nốt cứ nhầm mãi thì vấn đề nằm ở chỗ bạn
            chưa thuộc vị trí của nó, tập thêm bao nhiêu lần cũng vậy. Hãy quay lại phần lý thuyết
            của chương tương ứng.
          </Text>

          <Title order={4} mt="md">Cần gì để chạy được</Title>
          <Text size="sm">
            <b>Nghe qua micro</b> — chỉ cần chiếc điện thoại hay máy tính bảng bạn đang cầm, đặt trên
            giá nhạc cạnh đàn. Chạy trên cả iPhone, iPad và Android, với cả đàn cơ lẫn đàn điện.
            Âm thanh chỉ được xử lý ngay trên máy để nhận ra nốt, không ghi âm, không gửi đi đâu.
            Phòng càng yên thì máy nghe càng chuẩn.
          </Text>
          <Text size="sm">
            <b>Nối dây MIDI</b> — chính xác tuyệt đối, dành cho đàn có cổng USB: cắm vào điện thoại
            Android bằng cáp OTG (Chrome hoặc Edge), hoặc vào máy tính. iPhone và iPad chưa nối dây
            được — dùng micro là đủ.
          </Text>
          <Text size="sm" c="dimmed">
            Đây là công cụ hỗ trợ, không phải phần bắt buộc của giáo trình. Không dùng tới nó thì bạn
            vẫn học đủ mọi bài như bình thường.
          </Text>
        </Stack>
        </Card>
      </Container>
    </AppLayout>
  );
}
