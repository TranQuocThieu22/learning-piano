'use client';
import { AppShell, Burger, Group, NavLink, Title, ScrollArea, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MarkdownFile } from '@/lib/markdown';

export function AppLayout({ children, files }: { children: React.ReactNode, files: MarkdownFile[] }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const categories = files.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, MarkdownFile[]>);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>🎹 Piano Journey</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea>
          {Object.entries(categories).map(([cat, catFiles]) => {
            // Group by Lesson (e.g., "Bài 1", "Bài tập 2")
            const groupedFiles: Record<string, { label: string, files: MarkdownFile[] }> = {};
            const ungroupedFiles: MarkdownFile[] = [];

            // Sort files by slug to ensure "Ngày 1" comes before "Ngày 2"
            const sortedCatFiles = [...catFiles].sort((a, b) => a.slug.localeCompare(b.slug));

            sortedCatFiles.forEach(file => {
              // Phân tách title: "Bài tập 2 - Ngày 1: Nhịp điệu" -> base="Bài tập 2", topic="Nhịp điệu"
              // Hoặc "Bài tập 1: Làm quen..." -> base="Bài tập 1", topic="Làm quen..."
              const match = file.title.match(/^(Bài tập \d+|Bài \d+)(?:[\s-]*Ngày\s*\d+)?[:\s-]*([^]*)/i);
              
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
                  {cat.replace(/^\d+-/, '').replace(/-/g, ' ')}
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
                        label={file.title}
                        active={pathname === href}
                        onClick={() => { if (opened) toggle(); }}
                      />
                    );
                  }

                  // Render as a nested accordion
                  return (
                    <NavLink
                      key={groupName}
                      label={groupInfo.label}
                      childrenOffset={28}
                      defaultOpened={files.some(f => pathname === `/${f.category}/${f.slug}`)}
                    >
                      {files.map(file => {
                        const href = `/${file.category}/${file.slug}`;
                        // Try to extract Day from title, or just use the full title
                        const dayMatch = file.title.match(/(Ngày \d+)/i);
                        const label = dayMatch ? dayMatch[1] : file.title.replace(new RegExp(`^${groupName}[:\\s-]*`, 'i'), '') || 'Nội dung';
                        return (
                          <NavLink
                            key={file.slug}
                            href={href}
                            component={Link}
                            label={label}
                            active={pathname === href}
                            onClick={() => { if (opened) toggle(); }}
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
                      label={file.title}
                      active={pathname === href}
                      onClick={() => { if (opened) toggle(); }}
                    />
                  );
                })}
              </Box>
            );
          })}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
