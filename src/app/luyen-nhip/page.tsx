import { Container, Stack, Text, Title } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { Metronome } from '@/components/Metronome';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getCompletedLessonSlugs } from '@/lib/progress';

export const metadata = {
  title: 'Máy đánh nhịp — Piano Journey',
};

export default async function MetronomePage() {
  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs}>
      <Container size="sm" px={0}>
        <Title order={2} mb="xs">
          Máy đánh nhịp
        </Title>
        <Text c="dimmed" mb="lg">
          Mỗi bài tập đều ghi sẵn tốc độ ở dòng <code>Q: 1/4=60</code> — con số đó
          chính là BPM bạn cần đặt ở đây.
        </Text>

        <Metronome initialBpm={60} initialBeatsPerBar={4} />

        <Stack gap="sm" mt="xl">
          <Title order={4}>Dùng sao cho đúng</Title>
          <Stack gap="xs">
            <Text size="sm"><b>Nghe vài ô nhịp trước khi đánh.</b> Đừng vào đàn ngay. Hãy để tiếng
              gõ chạy, gật đầu hoặc giậm chân theo cho tới khi cơ thể bắt được nhịp,
              rồi mới bắt đầu chơi.
            </Text>
            <Text size="sm"><b>Tiếng cao là phách 1.</b> Máy gõ tiếng cao hơn ở đầu mỗi ô nhịp. Đó
              là mốc để bạn biết mình đang ở đâu trong ô nhịp — đặc biệt quan trọng
              với nhịp 3/4, khi cảm giác &quot;Bùm - chát - chát&quot; phải rơi đúng chỗ.
            </Text>
            <Text size="sm"><b>Chậm hơn bạn nghĩ.</b> Nếu chơi vấp, hạ xuống 40-50 BPM cũng không sao
              cả. Đánh đúng ở tốc độ chậm có giá trị hơn nhiều so với đánh sai ở tốc
              độ đúng.
            </Text>
            <Text size="sm"><b>Chỉ tăng tốc khi đã chắc.</b> Chơi trơn tru <b>ba lần liên tiếp không
              vấp</b> ở tốc độ hiện tại thì mới tăng, và mỗi lần chỉ tăng 5 BPM.
            </Text>
            <Text size="sm"><b>Đừng dùng suốt buổi.</b> Máy đánh nhịp để kiểm tra xem nhịp của bạn có
              đều không, chứ không phải để dựa dẫm. Hãy tập vài lượt có máy, rồi tắt đi
              đánh lại và tự cảm nhận.
            </Text>
          </Stack>

          <Title order={4} mt="md">
            Vì sao cần máy đánh nhịp?
          </Title>
          <Text size="sm">
            Người mới học thường vô thức <b>chơi nhanh ở đoạn dễ và chậm lại ở đoạn
            khó</b>. Tai mình tự nghe thì thấy vẫn đều, nhưng thực tế là không. Máy đánh
            nhịp là một mốc bên ngoài không bao giờ nhân nhượng, nên nó phơi bày ngay
            những chỗ bạn đang lén chậm lại — và đó chính là những chỗ cần tập thêm.
          </Text>
        </Stack>
      </Container>
    </AppLayout>
  );
}
