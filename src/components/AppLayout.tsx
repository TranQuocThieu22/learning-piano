'use client';
import { AppShell, Avatar, Burger, Button, Group, NavLink, Title, ScrollArea, Box, Text } from '@mantine/core';
import { IconChecklist, IconLock, IconMetronome, IconMusicSearch } from '@tabler/icons-react';
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MarkdownFile } from '@/lib/markdown';
import { isFreeContent } from '@/lib/access';
import { ThemeToggle } from './ThemeToggle';
import { signInWithGoogle, signOutAction } from '@/lib/auth-actions';

/** Vietnamese sidebar headings; falls back to the folder name if unlisted. */
const CATEGORY_LABELS: Record<string, string> = {
  '01-roadmap': 'Lộ trình',
  '02-chapters': 'Lý thuyết',
  '03-exercises': 'Bài tập',
  '07-doc-them': 'Đọc thêm',
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.replace(/^\d+-/, '').replace(/-/g, ' ');
}

export interface AppSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function AuthHeaderButton({ user }: { user: AppSessionUser | null }) {
  if (!user) {
    return (
      <form action={signInWithGoogle}>
        <Button type="submit" size="xs" variant="light" hiddenFrom="xs">
          Đăng nhập
        </Button>
        <Button type="submit" size="xs" variant="light" visibleFrom="xs">
          Đăng nhập với Google
        </Button>
      </form>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Avatar src={user.image ?? undefined} radius="xl" size="sm">
        {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
      </Avatar>
      <Text size="sm" visibleFrom="sm">
        {user.name ?? user.email}
      </Text>
      <form action={signOutAction}>
        <Button type="submit" size="xs" variant="subtle" color="gray">
          Đăng xuất
        </Button>
      </form>
    </Group>
  );
}

export function AppLayout({
  children,
  files,
  user = null,
  completedSlugs,
  hasFullAccess = false,
}: {
  children: React.ReactNode;
  files: MarkdownFile[];
  user?: AppSessionUser | null;
  completedSlugs?: Set<string>;
  /** Người xem đã mở khoá toàn bộ giáo trình chưa. Tính ở server, xem access-server.ts. */
  hasFullAccess?: boolean;
}) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const pathname = usePathname();

  /**
   * Trên điện thoại, thanh tiêu đề tự trượt đi khi cuộn xuống và hiện lại khi
   * cuộn lên, lấy lại 48px chiều cao vốn đã hiếm hoi khi đọc bài. Không áp cho
   * máy tính: ở đó chiều cao không phải thứ khan hiếm, mà thanh tiêu đề nhấp
   * nháy theo con lăn chuột thì chỉ gây khó chịu.
   *
   * Điều kiện !mobileOpened là bắt buộc: thanh bên đang mở mà thanh tiêu đề
   * trượt mất thì nút hamburger để đóng nó cũng biến mất theo.
   *
   * useMediaQuery trả về undefined ở lần dựng đầu (getInitialValueInEffect mặc
   * định bật) nên HTML server và client khớp nhau, không lỗi hydration.
   */
  const isMobile = useMediaQuery('(max-width: 48em)');
  const { pinned } = useHeadroom({ fixedAt: 120 });
  const headerCollapsed = Boolean(isMobile) && !pinned && !mobileOpened;

  const withTick = (label: string, slug: string) =>
    completedSlugs?.has(slug) ? `✓ ${label}` : label;

  const isLocked = (file: MarkdownFile) =>
    !hasFullAccess && !isFreeContent(file.category, file.slug);

  /**
   * Ổ khoá bên phải mục. Chỉ báo hiệu, KHÔNG chặn bấm — việc chặn nằm ở server
   * (src/app/[category]/[slug]/page.tsx). Vẫn cho bấm vào để người học đọc được
   * màn hình giải thích gói, thay vì bấm mãi mà không có phản hồi gì.
   */
  const lockIcon = (file: MarkdownFile) =>
    isLocked(file) ? (
      <IconLock size={14} opacity={0.5} aria-label="Bài trả phí" />
    ) : undefined;

  /**
   * Ổ khoá cho tiêu đề nhóm, chỉ khi CẢ nhóm bị khoá.
   *
   * Cần cái này vì Mantine chỉ render các mục con sau khi nhóm được bung ra —
   * không có nó thì thanh bên lúc đóng chẳng báo hiệu gì, người học vẫn phải
   * bấm vào mới biết. Nhóm nửa khoá nửa mở thì để trống, vì gắn khoá lên cả
   * nhóm sẽ nói dối về những bài miễn phí bên trong.
   */
  const groupLockIcon = (groupFiles: MarkdownFile[]) =>
    groupFiles.length > 0 && groupFiles.every(isLocked) ? (
      <IconLock size={14} opacity={0.5} aria-label="Cả nhóm là bài trả phí" />
    ) : undefined;

  const categories = files.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, MarkdownFile[]>);

  return (
    <AppShell
      header={{ height: { base: 48, sm: 60 }, collapsed: headerCollapsed, offset: false }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <AppShell.Header className="app-header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flexShrink: 1 }}>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            <Title
              order={3}
              style={{
                fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              🎹 Piano Journey
            </Title>
          </Group>
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <AuthHeaderButton user={user} />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="app-navbar">
        <ScrollArea>
          <NavLink
            href="/journal"
            component={Link}
            label="Nhật ký học tập"
            leftSection={<IconChecklist size={18} />}
            active={pathname === '/journal'}
            onClick={() => { if (mobileOpened) toggleMobile(); }}
          />
          <NavLink
            href="/metronome"
            component={Link}
            label="Máy đánh nhịp"
            leftSection={<IconMetronome size={18} />}
            active={pathname === '/metronome'}
            onClick={() => { if (mobileOpened) toggleMobile(); }}
          />
          <NavLink
            href="/note-trainer"
            component={Link}
            label="Luyện nhận nốt"
            leftSection={<IconMusicSearch size={18} />}
            active={pathname === '/note-trainer'}
            mb="md"
            onClick={() => { if (mobileOpened) toggleMobile(); }}
          />

          {Object.entries(categories).map(([cat, catFiles]) => {
            // Group by Lesson (e.g., "Bài 1", "Bài tập 2")
            const groupedFiles: Record<string, { label: string, files: MarkdownFile[] }> = {};
            const ungroupedFiles: MarkdownFile[] = [];

            // Sort files by slug to ensure "Ngày 1" comes before "Ngày 2"
            const sortedCatFiles = [...catFiles].sort((a, b) => a.slug.localeCompare(b.slug));

            sortedCatFiles.forEach(file => {
              // Phân tách title: "Bài tập 2 - Ngày 1: Nhịp điệu" -> base="Bài tập 2", topic="Nhịp điệu"
              // Phân tách title: "Chương 1 - Bài 1: Nốt liền kề" -> base="Chương 1", topic="Nốt liền kề"
              const match = file.title.match(/^(Chương \d+)(?:[\s-]*Bài\s*\d+)?[:\s-]*([^]*)/i);
              
              if (match) {
                const baseGroup = match[1]; // "Bài tập 2"
                const topic = match[2] ? match[2].trim() : ""; 
                // Khởi tạo group và lấy chủ đề của file đầu tiên (thường là Ngày 1) làm tiêu đề gốc
                if (!groupedFiles[baseGroup]) {
                  groupedFiles[baseGroup] = { label: topic ? `${baseGroup}: ${topic}` : baseGroup, files: [] };
                }
                groupedFiles[baseGroup].files.push(file);
              } else {
                ungroupedFiles.push(file);
              }
            });

            return (
              <Box key={cat} mb="md">
                <Title order={6} mb="sm" style={{ textTransform: 'uppercase', color: 'var(--mantine-color-dimmed)' }}>
                  {categoryLabel(cat)}
                </Title>

                {/* Render Grouped Files (3-level menu) */}
                {Object.entries(groupedFiles).map(([groupName, groupInfo]) => {
                  const files = groupInfo.files;
                  if (files.length === 1) {
                    // Just render it directly if there's only 1 day/file
                    const file = files[0];
                    const href = `/${file.category}/${file.slug}`;
                    return (
                      <NavLink
                        key={file.slug}
                        href={href}
                        component={Link}
                        label={withTick(file.title, file.slug)}
                        rightSection={lockIcon(file)}
                        active={pathname === href}
                        onClick={() => { if (mobileOpened) toggleMobile(); }}
                      />
                    );
                  }

                  // Render as a nested accordion
                  return (
                    <NavLink
                      key={groupName}
                      label={groupInfo.label}
                      childrenOffset={28}
                      rightSection={groupLockIcon(files)}
                      defaultOpened={files.some(f => pathname === `/${f.category}/${f.slug}`)}
                    >
                      {files.map(file => {
                        const href = `/${file.category}/${file.slug}`;
                        // Try to extract Bài from title, or just use the full title
                        const lessonMatch = file.title.match(/(Bài \d+)/i);
                        const label = lessonMatch ? lessonMatch[1] : file.title.replace(new RegExp(`^${groupName}[:\\s-]*`, 'i'), '') || 'Nội dung';
                        return (
                          <NavLink
                            key={file.slug}
                            href={href}
                            component={Link}
                            label={withTick(label, file.slug)}
                            rightSection={lockIcon(file)}
                            active={pathname === href}
                            onClick={() => { if (mobileOpened) toggleMobile(); }}
                          />
                        );
                      })}
                    </NavLink>
                  );
                })}

                {/* Render Ungrouped Files */}
                {ungroupedFiles.map(file => {
                  const href = `/${file.category}/${file.slug}`;
                  return (
                    <NavLink
                      key={file.slug}
                      href={href}
                      component={Link}
                      label={withTick(file.title, file.slug)}
                      rightSection={lockIcon(file)}
                      active={pathname === href}
                      onClick={() => { if (mobileOpened) toggleMobile(); }}
                    />
                  );
                })}
              </Box>
            );
          })}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main className="app-main">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
