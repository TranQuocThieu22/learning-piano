import { Container, Group, Text } from '@mantine/core';
import { IconArrowLeft, IconFolders } from '@tabler/icons-react';
import { notFound, redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { NavButton } from '@/components/NavButton';
import { PageHeader } from '@/components/PageHeader';
import { PhotoSheetForm } from '@/components/PhotoSheetForm';
import { PhotoSheetViewer } from '@/components/PhotoSheetViewer';
import { SheetTools } from '@/components/SheetTools';
import { SheetViewer } from '@/components/SheetViewer';
import { auth } from '@/auth';
import { getUserSheet } from '@/lib/user-sheets-server';
import { sheetSource } from '@/lib/user-sheets';

/**
 * Một bản nhạc trong kho riêng.
 *
 * Bài nhập từ file dùng lại **nguyên** `SheetViewer` của giáo trình, nên nó có đủ
 * nghe mẫu, phóng to, chế độ tập trung và *Tập bài này với đàn* qua micro hoặc
 * MIDI — không phải dựng lại gì cả. Đó chính là lý do đường nhập file đáng làm
 * trước đường chụp ảnh.
 *
 * Cố ý **không có nút tick, không đếm tiến độ**: bản nhạc tự đưa lên không nằm
 * trên đường đi của giáo trình, và biến nó thành một danh sách phải hoàn thành là
 * đúng thứ `AGENTS.md` cấm.
 */
export default async function MySheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  // Chưa đăng nhập thì về thẳng kho: ở đó có câu giải thích, còn 404 ở đây chỉ làm
  // người vừa mất phiên đăng nhập tưởng bản nhạc của mình biến mất.
  if (!userId) redirect('/my-sheets');

  const sheet = await getUserSheet(userId, id);
  if (!sheet) notFound();

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="extra"
          icon={<IconFolders size={26} />}
          title={sheet.title}
          description={sheetSource(sheet.source)?.note}
        />

        {sheet.kind === 'notes' && sheet.abc ? (
          <SheetViewer abcNotation={sheet.abc} />
        ) : (
          <>
            <PhotoSheetViewer pages={sheet.pages} title={sheet.title} />
            <Group mt="md">
              <PhotoSheetForm signedIn sheetId={sheet.id} compact />
            </Group>
          </>
        )}

        {sheet.kind === 'notes' && (
          <Text size="xs" c="dimmed" mt="sm">
            Bản nhạc này do bạn đưa lên, không nằm trong giáo trình — không có ô tick và không
            tính vào tiến độ.
          </Text>
        )}

        <SheetTools sheetId={sheet.id} title={sheet.title} />

        <Group mt="xl">
          <NavButton href="/my-sheets" variant="default" leftSection={<IconArrowLeft size={18} />}>
            Về kho nhạc của tôi
          </NavButton>
        </Group>
      </Container>
    </AppLayout>
  );
}
