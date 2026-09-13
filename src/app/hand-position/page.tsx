import { Card, Container, Stack, Text, Title } from '@mantine/core';
import { IconHandFinger } from '@tabler/icons-react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { HandPositionDrill } from '@/components/HandPositionDrill';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Đặt tay ở đâu',
};

/**
 * Công cụ trả lời câu hỏi mà giáo trình bỏ trống giữa Chương 1 và Chương 6:
 * bản nhạc đi ra ngoài năm nốt Đô–Sol thì đặt tay chỗ nào, dời tay lúc nào.
 *
 * Cố ý MIỄN PHÍ cho mọi người, cùng lý do với Góc bài hát: đây là chỗ người chưa
 * mua gặp đúng vướng mắc của mình và thấy giáo trình này có câu trả lời.
 */
export default function HandPositionPage() {
  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="trainer"
          icon={<IconHandFinger size={26} />}
          title="Đặt tay ở đâu"
          description="Bản nhạc đi ra ngoài năm nốt quen thuộc thì đặt tay chỗ nào, và dời tay ở đâu cho đỡ vấp. Nhìn bản nhạc, tự quyết, rồi xem đáp án kèm lý do."
        />

        <HandPositionDrill />

        <Card withBorder padding="lg" mt="xl">
          <Stack gap="sm">
            <Title order={4}>Ba câu hỏi, hỏi đúng thứ tự này</Title>
            <Text size="sm">
              Người chơi lâu năm không đọc bản nhạc theo từng nốt. Trước khi đặt tay xuống,
              họ liếc cả câu một lượt và trả lời ba câu hỏi dưới đây trong khoảng một giây.
              Bài luyện ở trên chính là tập làm việc đó cho thành nếp.
            </Text>
            {/*
              Danh sách bằng thẻ `<ol>` thường, KHÔNG dùng `List.Item` của Mantine:
              component ghép của Mantine trong Server Component trả `undefined` và
              trang gãy với thông báo "Element type is invalid" không chỉ ra file
              nào — bẫy 1. Ở đây không cần gì của Mantine ngoài cỡ chữ.
            */}
            <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <Text size="sm">
                  <b>Cả câu có nằm gọn trong một thế tay không?</b> Nhìn nốt thấp nhất và
                  nốt cao nhất. Cách nhau không quá năm phím trắng thì đặt tay một lần rồi
                  để yên — không phải dời đi đâu cả. Lỗi thường gặp nhất của người mới là
                  dời tay theo từng nốt vì chưa nhìn cả câu.
                </Text>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <Text size="sm">
                  <b>Chỉ lố ra đúng một nốt?</b> Thì <b>với thêm một ngón</b> rồi thu về,
                  đừng nhấc cả bàn tay. Nhấc tay vì một nốt là mất mốc, mà mất mốc thì
                  những nốt sau đó sai theo — cái giá đắt hơn nhiều so với một lần duỗi ngón.
                </Text>
              </li>
              <li>
                <Text size="sm">
                  <b>Lố nhiều nốt thì phải dời tay — nhưng dời ở đâu?</b> Tìm{' '}
                  <b>dấu lặng hoặc nốt ngân dài</b> gần chỗ đó nhất: lúc tiếng còn đang
                  vang thì tay đã rảnh, nhấc sang thế mới thoải mái. Đây là cách dễ nhất và
                  cũng là cách người chơi thật dùng nhiều nhất.
                </Text>
              </li>
            </ol>

            <Title order={4} mt="md">Khi không có chỗ nghỉ nào</Title>
            <Text size="sm">
              Một câu chạy liền bậc một mạch — như thang âm — thì không có dấu lặng nào để
              nhấc tay. Lúc đó mới cần tới hai kỹ thuật của{' '}
              {/*
                `<Link>` thật, KHÔNG phải `component={Link}` của Mantine: truyền một
                component qua ranh giới server/client là bẫy 22, và lần này chính
                `next build` chặn lại vì trang này dựng tĩnh.
              */}
              <Link
                href="/02-chapters/chuong-06"
                style={{ color: 'var(--mantine-color-anchor)', fontWeight: 600 }}
              >
                Chương 6
              </Link>
              : <b>luồn ngón cái</b> xuống dưới lòng bàn tay khi đi lên, và{' '}
              <b>vắt ngón 3</b> qua bên trên khi đi xuống. Hai tay đổi vai nhau — tay trái đi
              lên thì vắt ngón chứ không luồn — và đó là chỗ hay nhớ nhầm nhất.
            </Text>
            <Text size="sm" c="dimmed">
              Bài luyện ở trên cố ý không ra câu chạy thang âm: thế ngón của thang âm là một
              quy ước riêng, có bài dạy hẳn hoi ở Chương 6, nên ở đây đưa ra một thế ngón tự
              suy sẽ đá nhau với bài học.
            </Text>

            <Title order={4} mt="md">Dùng sao cho hiệu quả</Title>
            <Text size="sm">
              <b>Trả lời trước khi xem đáp án, kể cả khi chưa chắc.</b> Đoán rồi xem mình sai
              chỗ nào thì nhớ lâu hơn nhiều so với đọc luôn lời giải. Chọn sai không mất gì
              cả — ở đây không có điểm.
            </Text>
            <Text size="sm">
              <b>Không cần ngồi ở đàn — nhưng ngồi ở đàn thì tập được luôn.</b> Trả lời xong,
              bấm <b>Tập câu này với đàn</b> rồi đánh chính câu vừa đọc: app nghe qua micro
              hoặc qua dây MIDI, tô xanh nốt bạn bấm đúng ngay trong lúc đánh. Không đếm giờ,
              không có bản nhạc tự trôi — bạn dừng lúc nào cũng được. Hiểu bằng mắt và nhớ
              bằng tay là hai việc khác nhau, và đây là chỗ nối hai việc đó lại.
            </Text>
            <Text size="sm">
              <b>Mang thói quen này sang bài đang tập.</b> Mở một bài bất kỳ trong giáo
              trình, liếc câu đầu rồi tự trả lời ba câu hỏi trên trước khi đặt tay xuống. Đó
              mới là đích đến của công cụ này.
            </Text>
          </Stack>
        </Card>
      </Container>
    </AppLayout>
  );
}
