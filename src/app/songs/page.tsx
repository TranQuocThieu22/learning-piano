import { Alert, Badge, Container, Group, Stack, Text } from '@mantine/core';
import { IconInfoCircle, IconMusic } from '@tabler/icons-react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { capDoLabel, getAllSongs } from '@/lib/songs';

/**
 * Góc bài hát: danh sách những bài quen tai để thử cho vui.
 *
 * Cố ý KHÔNG có ô tick, không có tiến độ, không có bước trước bước sau — luật và
 * lý do ghi ở `src/lib/songs.ts`. Đây là chỗ chơi, không phải chỗ học.
 *
 * Cũng cố ý để MIỄN PHÍ cho mọi người (`PAID_CATEGORIES` trong `access.ts` không
 * có thư mục này): người chưa mua mà đánh được một câu quen tai là lý do tốt nhất
 * để họ quay lại, tốt hơn mọi lời quảng cáo.
 */
export default function SongsPage() {
  const songs = getAllSongs();

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="extra"
          icon={<IconMusic size={26} />}
          title="Góc bài hát"
          description="Những bài quen tai để thử cho vui. Không tick, không chấm điểm."
        />

        <Stack gap="sm">
          {songs.map((song) => (
            /*
              `<Link>` thật với CSS riêng, KHÔNG phải `Card component={Link}` của
              Mantine: truyền một component qua ranh giới server/client làm trang
              500 mà cả năm lệnh kiểm vẫn xanh — bẫy 22.
            */
            <Link key={song.slug} href={song.href} className="song-card">
              <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
                <div style={{ minWidth: 0 }}>
                  <Text fw={700}>{song.title}</Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {capDoLabel(song.capDo)}
                    {song.sauChuong !== null && ` · hợp sau Chương ${song.sauChuong}`}
                  </Text>
                  {/*
                    Nói ngay ở danh sách rằng bài nào có bản hai tay: người đã
                    đánh được bản cơ bản cần biết còn chỗ để đi tiếp, chứ không
                    phải mở từng bài ra xem.
                  */}
                  {song.coNangCao && (
                    <Text size="xs" c="grape" mt={2}>
                      Có bản nâng cao hai tay
                    </Text>
                  )}
                </div>
                <Badge variant="light" color="grape" style={{ flexShrink: 0 }}>
                  Cấp {song.capDo}
                </Badge>
              </Group>
            </Link>
          ))}
        </Stack>

        {/*
          Nói thẳng vì sao không có nhạc đang thịnh hành, ngay tại chỗ người học
          sẽ thắc mắc. Giấu đi thì họ tưởng app nghèo bài; nói ra thì họ hiểu đây
          là lựa chọn có lý do.
        */}
        <Alert
          icon={<IconInfoCircle size={18} />}
          color="gray"
          variant="light"
          mt="xl"
          title="Vì sao chưa có bài đang thịnh hành?"
        >
          <Text size="sm">
            Những bài ở đây đều đã hết hạn bảo hộ bản quyền nên ai cũng được phép soạn lại và
            chia sẻ. Các bài mới hơn vẫn còn bản quyền — muốn đưa vào thì phải xin phép tác
            giả trước, và đó là việc đang làm. Bạn có bài muốn được học thì cứ nhắn, nó giúp
            chọn đúng bài để đi xin phép.
          </Text>
        </Alert>
      </Container>
    </AppLayout>
  );
}
