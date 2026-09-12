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
            <b>Chọn đúng phần mình đang yếu.</b> Bấm các nút quãng ở trên — một quãng cho quen mặt
            chữ, hai ba quãng cách xa nhau để tập mắt nhảy. Hình cây đàn phía trên bôi xanh đúng vùng
            bạn vừa chọn, nên đối chiếu được ngay với cây đàn trước mặt. Tắt &quot;chỉ năm nốt Đô–Sol&quot;
            khi tay đã quen với tới.
          </Text>
          <Text size="sm">
            <b>Hoá biểu — mấy dấu thăng giáng đứng ở đầu khuông.</b> Bản nhạc thật không viết dấu
            thăng cạnh từng nốt; nó ghi một lần ở đầu khuông rồi coi như bạn nhớ. Chọn giọng ở ô
            &quot;Hoá biểu&quot; thì bài tập cũng làm đúng như vậy: nốt nằm trong giọng hiện ra
            <b>không có dấu nào bên cạnh</b>, bạn phải tự nhớ nó là phím đen hay phím trắng. Bắt đầu
            bằng giọng Đô trưởng (không dấu nào), rồi khi trong bài đang tập gặp giọng nào thì chọn
            đúng giọng đó. Công tắc &quot;thêm nốt hoá bất thường&quot; là chuyện khác: nó thêm những
            nốt nằm <i>ngoài</i> hoá biểu, có dấu thăng, giáng hay bình viết ngay cạnh nốt — bản nhạc
            thật cũng làm thế khi cần một nốt lạ.
          </Text>
          <Text size="sm">
            <b>&quot;Cả hai tay&quot; là mức khó nhất.</b> Bản nhạc hiện đủ hai khuông như bản nhạc piano
            thật, và nốt có thể nằm ở khuông trên hay khuông dưới — bạn phải nhìn ra nó nằm ở khuông
            nào trước, rồi mới đọc nốt. Đây đúng là việc phải làm khi đọc bản nhạc thật.
          </Text>
          <Text size="sm">
            <b>Chồng nốt như hợp âm.</b> Ô &quot;tối đa mấy nốt mỗi khuông&quot; cho phép mỗi khuông
            hiện tới bốn nốt chồng lên nhau, đúng kiểu bản nhạc thật viết hợp âm. Chồng nốt luôn nằm
            trong tầm một bàn tay và không có hai nốt sát nhau nửa cung, nên bấm được thật chứ không
            phải chồng cho có. Mỗi câu bốc ngẫu nhiên từ một tới mức bạn chọn — câu nào cũng đủ chồng
            thì không giống bản nhạc thật.
          </Text>
          <Text size="sm">
            <b>Chọn được mỗi câu một hay hai nốt.</b> Hai nốt là hai tay bấm cùng lúc, mỗi khuông một
            nốt — bấm nốt nào trước cũng được, app đợi đủ cả hai. Chọn &quot;lúc 1 lúc 2&quot; thì không
            đoán trước được, sát bản nhạc thật nhất: có chỗ chỉ một tay đánh, có chỗ hai tay cùng đánh.
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
