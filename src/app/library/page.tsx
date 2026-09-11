import { Badge, Container, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconBook2, IconBulb, IconLock, IconRoute } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { LinkRow } from '@/components/LinkRow';
import { PageHeader } from '@/components/PageHeader';
import { auth } from '@/auth';
import { getAllMarkdownFiles, type MarkdownFile } from '@/lib/markdown';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';

/**
 * Mục lục của phần chữ: lý thuyết, lộ trình và đọc thêm.
 *
 * Tên trang là "Mục lục" chứ không phải "Lý thuyết" dù lý thuyết chiếm phần lớn:
 * ở đây còn có lộ trình và đọc thêm, mà đặt tên theo mục to nhất thì hai mục kia
 * thành ra bị giấu.
 *
 * Đây là nơi thanh bên cũ đi về. Bỏ thanh bên mà không có trang này thì tám
 * chương lý thuyết và mấy bài đọc thêm không còn đường nào tới — phần bài tập đã
 * có bản đồ riêng ở `/exercises`, còn phần chữ thì trước giờ chỉ nằm trong thanh
 * bên.
 *
 * Xếp theo slug chứ không theo tiêu đề: `chuong-00` … `chuong-07` là thứ tự học,
 * còn sắp theo tiêu đề tiếng Việt thì dấu làm lộn xộn ngay.
 */

const SECTIONS = [
  {
    category: '02-chapters',
    label: 'Lý thuyết',
    hint: 'Đọc để hiểu vì sao, trước khi tập',
    section: 'library',
    Icon: IconBook,
  },
  {
    category: '01-roadmap',
    label: 'Lộ trình',
    hint: 'Đường đi từ số 0 và cách luyện tập',
    section: 'roadmap',
    Icon: IconRoute,
  },
  {
    category: '07-doc-them',
    label: 'Đọc thêm',
    hint: 'Chuyện bên lề, không nằm trong lộ trình tập',
    section: 'extra',
    Icon: IconBulb,
  },
];

/** Số chương lấy từ slug `chuong-03` → `3`, để in lên ô màu đầu dòng. */
function chapterNumberOf(slug: string): number | null {
  const match = /^chuong-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}

export default async function LibraryPage() {
  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const hasFullAccess = await viewerHasFullAccess(session);

  const byCategory = (category: string): MarkdownFile[] =>
    allFiles
      .filter((f) => f.category === category)
      .sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="library"
          icon={<IconBook2 size={26} />}
          title="Mục lục"
          description="Toàn bộ phần chữ của giáo trình, theo thứ tự nên đọc."
        />

        <Stack gap="xl">
          {SECTIONS.map(({ category, label, hint, section, Icon }) => {
            const files = byCategory(category);
            if (files.length === 0) return null;

            return (
              <div key={category}>
                <Title order={2} size="h4">
                  {label}
                </Title>
                <Text size="sm" c="dimmed" mb="sm">
                  {hint}
                </Text>

                <Stack gap="xs">
                  {files.map((file) => {
                    const locked = !canReadLesson({
                      category: file.category,
                      slug: file.slug,
                      hasFullAccess,
                    });
                    const so = chapterNumberOf(file.slug);

                    return (
                      <LinkRow
                        key={file.slug}
                        href={`/${file.category}/${file.slug}`}
                        title={file.title}
                        leading={
                          <span className="section-icon section-icon--xs" data-section={section} aria-hidden>
                            {so !== null ? so : <Icon size={20} />}
                          </span>
                        }
                        /* Ổ khoá chỉ để báo hiệu, không chặn bấm — việc chặn thật
                           nằm ở server, xem `[category]/[slug]/page.tsx`. */
                        trailing={
                          locked ? (
                            <Badge
                              color="gray"
                              variant="light"
                              size="sm"
                              leftSection={<IconLock size={12} />}
                              style={{ flexShrink: 0 }}
                            >
                              Trả phí
                            </Badge>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </Stack>
              </div>
            );
          })}
        </Stack>
      </Container>
    </AppLayout>
  );
}
