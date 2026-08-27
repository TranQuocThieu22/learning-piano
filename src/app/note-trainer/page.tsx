import { Container, Stack, Text, Title } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { viewerHasFullAccess } from '@/lib/access-server';
import { NoteRecognitionDrill } from '@/components/NoteRecognitionDrill';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getCompletedLessonSlugs } from '@/lib/progress';

export const metadata = {
  title: 'Luyện nhận nốt — Piano Journey',
};

export default async function NoteRecognitionPage() {
  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  // Để thanh bên biết bài nào cần gắn ổ khoá.
  const hasFullAccess = await viewerHasFullAccess(session);

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs} hasFullAccess={hasFullAccess}>
      <Container size="sm" px={0}>
        <Title order={2} mb="xs">Luyện nhận nốt</Title>
        <Text c="dimmed" mb="lg">
          Nối đàn vào máy tính, màn hình hiện một nốt, bạn bấm phím tương ứng trên đàn thật.
          Không đếm giờ, không chấm điểm khi đang chơi — cứ chậm bao nhiêu tùy bạn.
        </Text>

        <NoteRecognitionDrill />

        <Stack gap="sm" mt="xl">
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
            Một cây đàn có cổng USB hoặc MIDI, dây nối tới máy tính, và trình duyệt Chrome, Edge,
            Opera hoặc Firefox trên máy tính. Safari và các trình duyệt trên iPhone/iPad chưa hỗ trợ
            Web MIDI. Đàn không cần cài phần mềm gì thêm.
          </Text>
          <Text size="sm" c="dimmed">
            Đây là công cụ hỗ trợ, không phải phần bắt buộc của giáo trình. Không có đàn cắm được
            vào máy tính thì bạn vẫn học đủ mọi bài như bình thường.
          </Text>
        </Stack>
      </Container>
    </AppLayout>
  );
}
