import { Container, Stack, Text, Title } from '@mantine/core';
import { IconBook2, IconBulb, IconMusic, IconRoute, IconSparkles } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { LinkRow } from '@/components/LinkRow';
import { PageHeader } from '@/components/PageHeader';
import { getAllMarkdownFiles, type MarkdownFile } from '@/lib/markdown';
import { listUpdates } from '@/lib/updates';

/**
 * Mục lục những bài KHÔNG nằm trên đường đi: lộ trình, đọc thêm, bài hát, cập nhật.
 *
 * **Lý thuyết đã được gỡ khỏi đây (12/09/2026).** Từ đợt gom lý thuyết, bài tập và
 * ô tick thành một đường đi theo chương, tám chương lý thuyết đã có nhà chính thức
 * ở `/path` — mỗi chương một trang, lý thuyết đứng đầu rồi tới từng bài tập, tick
 * ngay tại chỗ. Liệt kê lại ở đây là **hai danh sách vẽ cùng một thứ**, đúng cái
 * bệnh mà đợt gom đó đã chữa cho `/exercises` và `/journal`: người học phải nhớ
 * trang nào làm việc gì. Danh sách ở đây còn tệ hơn danh sách kia một bậc vì nó
 * không có ô tick và không biết người học đang ở chương nào.
 *
 * Vì vậy trang này nay chỉ còn đúng những bài **không có thứ tự và không tick
 * được**. Đó cũng là lý do nó vẫn ở lại trên thanh tab.
 *
 * Kéo theo: không còn mục nào ở đây thuộc `PAID_CATEGORIES` (xem `access.ts`), nên
 * cũng không còn nhãn "Trả phí" — bỏ luôn phần tra quyền, và trang thành tĩnh.
 *
 * Xếp theo slug chứ không theo tiêu đề: sắp theo tiêu đề tiếng Việt thì dấu làm
 * lộn xộn ngay.
 */

const SECTIONS = [
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
  {
    category: '08-bai-hat',
    label: 'Góc bài hát',
    hint: 'Bài quen tai để thử cho vui — không tick, không chấm',
    section: 'extra',
    Icon: IconMusic,
  },
];

/**
 * Bao nhiêu bài cập nhật hiện ở đây.
 *
 * Cắt ngắn vì Mục lục là mục lục của giáo trình, không phải trang tin: liệt kê
 * hết thì sau vài tháng phần cập nhật dài hơn cả phần lý thuyết. Cả danh sách
 * nằm ở `/updates`.
 */
const SO_BAI_CAP_NHAT = 4;

export default function LibraryPage() {
  const allFiles = getAllMarkdownFiles();
  const updates = listUpdates();

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
          description="Những bài đọc ngoài đường đi. Lý thuyết từng chương nằm ở Đường đi."
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
                  {files.map((file) => (
                    <LinkRow
                      key={file.slug}
                      href={`/${file.category}/${file.slug}`}
                      title={file.title}
                      leading={
                        <span className="section-icon section-icon--xs" data-section={section} aria-hidden>
                          <Icon size={20} />
                        </span>
                      }
                    />
                  ))}
                </Stack>
              </div>
            );
          })}

          {/*
            *Có gì mới* đứng CUỐI: người mở Mục lục là để tìm một bài đọc, không
            phải để đọc tin. Nhưng vẫn có mặt ở đây, vì đây là trang người học
            lướt qua nhiều nhất sau màn hình chủ — thấy vài dòng có ngày tháng là
            thấy trang này đang được làm tiếp.
          */}
          {updates.length > 0 && (
            <div>
              <Title order={2} size="h4">
                Có gì mới
              </Title>
              <Text size="sm" c="dimmed" mb="sm">
                Web vừa đổi những gì
              </Text>

              <Stack gap="xs">
                {updates.slice(0, SO_BAI_CAP_NHAT).map((post) => (
                  <LinkRow
                    key={post.slug}
                    href={`/updates#${post.slug}`}
                    title={post.title}
                    meta={post.nhan ? `${post.dateLabel} · ${post.nhan}` : post.dateLabel}
                    leading={
                      <span className="section-icon section-icon--xs" data-section="updates" aria-hidden>
                        <IconSparkles size={20} />
                      </span>
                    }
                  />
                ))}
                {updates.length > SO_BAI_CAP_NHAT && (
                  <LinkRow
                    href="/updates"
                    title="Xem tất cả bài cập nhật"
                    leading={
                      <span className="section-icon section-icon--xs" data-section="updates" aria-hidden>
                        <IconSparkles size={20} />
                      </span>
                    }
                  />
                )}
              </Stack>
            </div>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}
