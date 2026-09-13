import { Alert, Badge, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconFolders, IconInfoCircle, IconLock } from '@tabler/icons-react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { ImportSheetForm } from '@/components/ImportSheetForm';
import { PageHeader } from '@/components/PageHeader';
import { PhotoSheetForm } from '@/components/PhotoSheetForm';
import { auth } from '@/auth';
import { listUserSheets } from '@/lib/user-sheets-server';
import { MAX_SHEETS_PER_USER, sheetSourceLabel } from '@/lib/user-sheets';

/**
 * **Kho nhạc của tôi** — bản nhạc do chính người học đưa lên, chỉ mình họ xem.
 *
 * Vì sao có trang này: kho bài hát của app chỉ có nhạc đã hết hạn bảo hộ (xem
 * `src/lib/songs.ts`), nên bài người học đang muốn tập thường không có ở đó. Hai
 * đường vào, hợp với hai thứ người học thật sự có trong tay:
 *
 * - **File `.mid` / `.musicxml`** — app đọc ra nốt, nên nghe mẫu và *Tập bài này
 *   với đàn* dùng được đầy đủ.
 * - **Ảnh chụp trang giấy** — app không đọc được nốt, chỉ để đọc trên giá nhạc.
 *
 * Ranh giới pháp lý và bốn điều phải giữ nằm ở đầu `src/lib/user-sheets.ts`. Điều
 * quan trọng nhất nhìn thấy ngay trên trang này: **không có bất cứ đường nào để
 * một bản nhạc của người này hiện ra cho người khác.**
 */
export const metadata = { title: 'Kho nhạc của tôi' };

export default async function MySheetsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const sheets = userId ? await listUserSheets(userId) : [];

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="extra"
          icon={<IconFolders size={26} />}
          title="Kho nhạc của tôi"
          description="Bản nhạc bạn tự đưa lên. Chỉ mình bạn xem được."
        />

        {!userId && (
          <Alert color="gray" variant="light" icon={<IconLock size={18} />} mb="lg">
            <Text size="sm">
              Kho nhạc gắn với tài khoản Google của bạn. Đăng nhập ở Trang chủ rồi quay lại đây.
            </Text>
          </Alert>
        )}

        {sheets.length > 0 && (
          <Stack gap="sm" mb="xl">
            {sheets.map((sheet) => (
              /* `<Link>` thật với CSS riêng, không phải `Card component={Link}` — bẫy 22. */
              <Link key={sheet.id} href={`/my-sheets/${sheet.id}`} className="song-card">
                <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
                  <div style={{ minWidth: 0 }}>
                    <Text fw={700} lineClamp={1}>{sheet.title}</Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {sheetSourceLabel(sheet.source)}
                      {sheet.kind === 'photo' && ` · ${sheet.pageCount} trang`}
                    </Text>
                  </div>
                  <Badge
                    variant="light"
                    color={sheet.kind === 'photo' ? 'grape' : 'teal'}
                    style={{ flexShrink: 0 }}
                  >
                    {sheet.kind === 'photo' ? 'Ảnh' : 'Có nốt'}
                  </Badge>
                </Group>
              </Link>
            ))}
            <Text size="xs" c="dimmed">
              {sheets.length}/{MAX_SHEETS_PER_USER} bản nhạc trong kho.
            </Text>
          </Stack>
        )}

        <Stack gap="lg">
          <Card withBorder radius="md" padding="lg">
            <Title order={2} size="h4" mb={4}>
              Nhập từ file nhạc
            </Title>
            <Text size="sm" c="dimmed" mb="sm">
              File <strong>.mid</strong> hoặc <strong>.musicxml</strong> — app đọc ra nốt nên nghe
              mẫu và tập với đàn thật được như mọi bài trong giáo trình.
            </Text>
            <ImportSheetForm signedIn={Boolean(userId)} />
          </Card>

          <Card withBorder radius="md" padding="lg">
            <Title order={2} size="h4" mb={4}>
              Chụp bản nhạc giấy
            </Title>
            <Text size="sm" c="dimmed" mb="sm">
              Chụp từng trang sách rồi đọc trên máy đặt ở giá nhạc, khỏi lật giấy lúc hai tay
              đang bận.
            </Text>
            <PhotoSheetForm signedIn={Boolean(userId)} />
          </Card>
        </Stack>

        {/*
          Nói rõ hai điều ngay tại chỗ người học sắp đưa bản nhạc lên: app không
          đem nó cho ai, và bản quyền của thứ họ đưa lên là chuyện của họ. Đây
          không phải câu chữ phòng thân — nó là điều kiện để app còn ở vị trí nơi
          chứa (xem `src/lib/user-sheets.ts`).
        */}
        <Alert
          icon={<IconInfoCircle size={18} />}
          color="gray"
          variant="light"
          mt="xl"
          title="Bản nhạc ở đây đi đâu?"
        >
          <Text size="sm">
            Không đi đâu cả. Chúng nằm trong tài khoản của bạn, không hiện ra cho người học khác,
            không có đường chia sẻ, và bạn xoá lúc nào cũng được. Đổi lại, bạn chỉ nên đưa lên
            bản nhạc mình có quyền dùng — bản tự chép, bản đã mua, hoặc nhạc đã hết hạn bảo hộ.
            Chi tiết ở <Link href="/terms">Điều khoản sử dụng</Link>.
          </Text>
        </Alert>
      </Container>
    </AppLayout>
  );
}
