import { Container } from '@mantine/core';
import { IconEar } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { EarTrainingDrill } from '@/components/EarTrainingDrill';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Luyện tai',
};

/**
 * Luyện tai — chiều ngược lại của bài luyện nhận nốt.
 *
 * Bài kia dạy **mắt → tay** (nhìn nốt rồi bấm phím). Bài này dạy **tai → tay**:
 * app phát một câu, người học mò trên cây đàn thật cho tới khi trúng. Với người
 * tự học không có thầy, đây là thứ không ai rèn cho họ — mà lại chính là thứ họ
 * muốn làm được: nghe một bài mình thích rồi mò ra nó trên đàn.
 */
export default function EarTrainingPage() {
  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="trainer"
          icon={<IconEar size={26} />}
          title="Luyện tai"
          description="App phát một câu, bạn mò trên đàn thật cho tới khi trúng — app chỉ nói cao hơn hay thấp hơn, không nói tên nốt. Nghe lại bao nhiêu lần cũng được, không đếm giờ."
        />

        <EarTrainingDrill />
      </Container>
    </AppLayout>
  );
}
