import type { CSSProperties } from 'react';
import { Card, Container, Stack, Text, Title } from '@mantine/core';
import { IconMetronome } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { Metronome } from '@/components/Metronome';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Máy đánh nhịp',
};

/** Màu cho ô số thứ tự của từng mẹo — cùng tông cam với cả trang. */
const ORANGE_BUBBLE = {
  '--dot-soft': 'var(--mantine-color-orange-light)',
  '--dot-ink': 'var(--mantine-color-orange-light-color)',
} as CSSProperties;

const TIPS = [
  <>
    <b>Nghe vài ô nhịp trước khi đánh.</b> Đừng vào đàn ngay. Hãy để tiếng gõ chạy, gật đầu
    hoặc giậm chân theo cho tới khi cơ thể bắt được nhịp, rồi mới bắt đầu chơi.
  </>,
  <>
    <b>Tiếng cao là phách 1.</b> Máy gõ tiếng cao hơn ở đầu mỗi ô nhịp. Đó là mốc để bạn biết
    mình đang ở đâu trong ô nhịp — đặc biệt quan trọng với nhịp 3/4, khi cảm giác &quot;Bùm -
    chát - chát&quot; phải rơi đúng chỗ.
  </>,
  <>
    <b>Chậm hơn bạn nghĩ.</b> Nếu chơi vấp, hạ xuống 40-50 BPM cũng không sao cả. Đánh đúng ở
    tốc độ chậm có giá trị hơn nhiều so với đánh sai ở tốc độ đúng.
  </>,
  <>
    <b>Chỉ tăng tốc khi đã chắc.</b> Chơi trơn tru <b>ba lần liên tiếp không vấp</b> ở tốc độ
    hiện tại thì mới tăng, và mỗi lần chỉ tăng 5 BPM.
  </>,
  <>
    <b>Đừng dùng suốt buổi.</b> Máy đánh nhịp để kiểm tra xem nhịp của bạn có đều không, chứ
    không phải để dựa dẫm. Hãy tập vài lượt có máy, rồi tắt đi đánh lại và tự cảm nhận.
  </>,
];

export default async function MetronomePage() {
  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="metronome"
          icon={<IconMetronome size={26} />}
          title="Máy đánh nhịp"
          description={
            <>
              Mỗi bài tập đều ghi sẵn tốc độ ở dòng <code>Q: 1/4=60</code> — con số đó chính là
              BPM bạn cần đặt ở đây.
            </>
          }
        />

        <Metronome initialBpm={60} initialBeatsPerBar={4} />

        <Card withBorder padding="lg" mt="xl" style={ORANGE_BUBBLE}>
          <Title order={2} size="h4" mb="md">
            Dùng sao cho đúng
          </Title>
          <Stack gap="md">
            {TIPS.map((tip, i) => (
              <div key={i} className="tip-row">
                <span className="num-bubble" aria-hidden>
                  {i + 1}
                </span>
                <Text size="sm">{tip}</Text>
              </div>
            ))}
          </Stack>
        </Card>

        <Card withBorder padding="lg" mt="md">
          <Title order={2} size="h4" mb="xs">
            Vì sao cần máy đánh nhịp?
          </Title>
          <Text size="sm">
            Người mới học thường vô thức <b>chơi nhanh ở đoạn dễ và chậm lại ở đoạn
            khó</b>. Tai mình tự nghe thì thấy vẫn đều, nhưng thực tế là không. Máy đánh
            nhịp là một mốc bên ngoài không bao giờ nhân nhượng, nên nó phơi bày ngay
            những chỗ bạn đang lén chậm lại — và đó chính là những chỗ cần tập thêm.
          </Text>
        </Card>
      </Container>
    </AppLayout>
  );
}
