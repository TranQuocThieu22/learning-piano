'use client';

import { Button, RingProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconBook2,
  IconChevronRight,
  IconMusic,
  IconMusicSearch,
  IconPlayerPlayFilled,
  IconRoute,
  IconSparkles,
  type IconProps,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { AccountCard } from './AccountCard';
import { AmbientControl } from './AmbientControl';
import type { AppSessionUser } from './AppLayout';
import { ChapterCard, type MapChapter } from './ExerciseMap';

/**
 * Màn hình chủ của app.
 *
 * Trước đây `/` chỉ `redirect()` sang trang lộ trình, nên mở app ra là rơi thẳng
 * vào một trang tài liệu dài và mọi đường đi khác đều phải qua nút hamburger —
 * hai lần chạm và một danh sách hơn bốn mươi mục. Ở đây gom lại thành những ô to
 * bấm được bằng ngón cái, đúng thứ người học cần ngay khi mở máy.
 *
 * Thứ tự cố ý: *Học tiếp* đứng trên cùng và to nhất, vì chín trên mười lần mở app
 * là để học tiếp chỗ đang dở. Ngay dưới là chương đang học — thấy mình đã đi được
 * bao xa là lý do để mở app lần sau. Mấy ô còn lại chỉ là đường tắt cho những
 * đích KHÔNG có trên thanh tab; mục lục đầy đủ nằm ở `/library` và `/path`.
 */

interface Tile {
  href: string;
  label: string;
  hint: string;
  Icon: ComponentType<IconProps>;
  /** Cặp màu, khai ở `[data-section]` trong globals.css. */
  section: string;
}

export interface HomeScreenProps {
  /** Người đang đăng nhập, `null` nếu chưa. Dùng cho lời chào và thẻ tài khoản. */
  user: AppSessionUser | null;
  completedCount: number;
  totalCount: number;
  /** Bài đầu tiên chưa tick. `null` nghĩa là đã tick hết. */
  continueLesson: { title: string; href: string } | null;
  /** Bài đầu tiên của giáo trình, để người chưa học lần nào có chỗ bắt đầu. */
  firstLesson: { title: string; href: string } | null;
  /** Chương chứa bài đang tới, `null` khi giáo trình chưa có bài tập nào. */
  currentChapter: MapChapter | null;
  /** Trang lộ trình và bài đọc thêm đầu tiên, tính ở server. */
  roadmapHref: string | null;
  extraHref: string | null;
  /** Bài cập nhật mới nhất. `null` khi chưa có bài nào. */
  latestUpdate: { title: string; dateLabel: string; nhan: string | null } | null;
}

/** Hàng phím đàn trang trí góc khối *Học tiếp*. Chỉ để nhìn, trình đọc màn hình bỏ qua. */
function PianoKeysDecor() {
  const whites = Array.from({ length: 7 }, (_, i) => i);
  const blacks = [0, 1, 3, 4, 5];
  return (
    <svg className="home-hero__keys" viewBox="0 0 168 90" aria-hidden focusable="false">
      {whites.map((i) => (
        <rect key={`w${i}`} x={i * 24} y={0} width={22} height={90} rx={4} fill="#fff" />
      ))}
      {blacks.map((i) => (
        <rect key={`b${i}`} x={i * 24 + 15} y={0} width={14} height={54} rx={3} fill="#1c1733" />
      ))}
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={800} tt="uppercase" c="dimmed" mb={8} style={{ letterSpacing: 0.6 }}>
      {children}
    </Text>
  );
}

export function HomeScreen({
  user,
  completedCount,
  totalCount,
  continueLesson,
  firstLesson,
  currentChapter,
  roadmapHref,
  extraHref,
  latestUpdate,
}: HomeScreenProps) {
  const daHocXongHet = totalCount > 0 && completedCount === totalCount;
  const chuaHocBai = completedCount === 0;
  const dichTiepTheo = continueLesson ?? firstLesson;
  const phanTram = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  /*
   * Chỉ những đích KHÔNG có trên thanh tab. Trang chủ, Mục lục, Đường đi và Nhịp
   * đã nằm sẵn dưới đáy màn hình — bày lại thành ô ở đây chỉ làm dài trang mà
   * không rút ngắn được đường đi nào.
   */
  const tiles: Tile[] = [
    {
      // Đứng đầu trong nhóm ô: đây là thứ kéo người học ngồi xuống đàn lúc họ
      // chưa muốn học bài nào, mà ngồi xuống được là đã hơn không ngồi.
      href: '/songs',
      label: 'Góc bài hát',
      hint: 'Thử bài quen tai',
      Icon: IconMusic,
      section: 'extra',
    },
    ...(roadmapHref
      ? [{ href: roadmapHref, label: 'Lộ trình', hint: 'Đường đi từ số 0', Icon: IconRoute, section: 'roadmap' }]
      : []),
    {
      href: '/note-trainer',
      label: 'Luyện nhận nốt',
      hint: 'Vài phút mỗi ngày',
      Icon: IconMusicSearch,
      section: 'trainer',
    },
    ...(extraHref
      ? [{ href: extraHref, label: 'Đọc thêm', hint: 'Chuyện bên lề', Icon: IconBook2, section: 'extra' }]
      : []),
  ];

  return (
    <Stack gap="lg">
      <section className="home-hero" aria-label="Học tiếp">
        <PianoKeysDecor />
        <div className="home-hero__content">
          <Text size="sm" fw={600} className="home-hero__soft" lineClamp={1}>
            {user?.name ? `Chào ${user.name} 👋` : 'Chào bạn 👋'}
          </Text>

          {daHocXongHet ? (
            <Stack gap={6} mt="xs">
              <Title order={2} size="h3" c="white">
                Đã tick hết bài hiện có 🎉
              </Title>
              <Text size="sm" className="home-hero__soft">
                Quay lại bài cũ tập cho nhuyễn cũng là học — tiến độ không mất đi đâu.
              </Text>
            </Stack>
          ) : (
            <>
              <div className="home-hero__row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" fw={800} tt="uppercase" className="home-hero__soft" style={{ letterSpacing: 0.8 }}>
                    {chuaHocBai ? 'Bắt đầu từ đây' : 'Học tiếp'}
                  </Text>
                  <Title order={2} size="h3" c="white" lineClamp={3}>
                    {dichTiepTheo?.title ?? 'Giáo trình đang được soạn'}
                  </Title>
                </div>

                {totalCount > 0 && (
                  <RingProgress
                    size={80}
                    thickness={7}
                    // Ở 0% đầu bo tròn vẫn vẽ ra một chấm, trông như đã học được chút ít.
                    roundCaps={phanTram > 0}
                    rootColor="rgba(255, 255, 255, 0.25)"
                    sections={[{ value: phanTram, color: 'white' }]}
                    aria-label={`Đã học ${completedCount} trên ${totalCount} bài`}
                    label={
                      <Text ta="center" fw={800} size="sm" c="white" lh={1.1}>
                        {completedCount}/{totalCount}
                        <Text component="span" display="block" size="10px" fw={600} className="home-hero__soft">
                          bài
                        </Text>
                      </Text>
                    }
                    style={{ flexShrink: 0 }}
                  />
                )}
              </div>

              {dichTiepTheo && (
                <Button
                  component={Link}
                  href={dichTiepTheo.href}
                  variant="white"
                  size="lg"
                  fullWidth
                  mt="md"
                  leftSection={<IconPlayerPlayFilled size={20} />}
                >
                  {chuaHocBai ? 'Bắt đầu học' : 'Học tiếp'}
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      {currentChapter && (
        <ChapterCard
          chapter={currentChapter}
          action={
            <Button
              component={Link}
              href="/path"
              variant="subtle"
              size="compact-sm"
              rightSection={<IconChevronRight size={16} />}
              style={{ flexShrink: 0 }}
            >
              Cả bản đồ
            </Button>
          }
        />
      )}

      {/*
        *Có gì mới* đứng ngay dưới chương đang học, KHÔNG đứng trên nút Học tiếp:
        người mở app ra là để tập, tin cập nhật không được chen ngang việc đó.
        Nhưng cũng không đẩy xuống cuối trang, vì nó trả lời một câu người học
        thật sự thắc mắc trong lúc beta — "trang này còn ai làm không". Hiện
        tiêu đề bài mới nhất kèm ngày, chứ không phải một chữ "Cập nhật" chung
        chung: có ngày tháng thì mới là bằng chứng.
      */}
      {latestUpdate && (
        <div>
          <SectionLabel>Có gì mới</SectionLabel>
          <Link href="/updates" className="home-news">
            <span className="section-icon section-icon--sm" data-section="updates" aria-hidden>
              <IconSparkles size={24} />
            </span>
            <span className="home-news__text">
              <Text size="xs" c="dimmed" lh={1.3}>
                {latestUpdate.dateLabel}
                {latestUpdate.nhan && ` · ${latestUpdate.nhan}`}
              </Text>
              <Text fw={700} size="sm" lh={1.3} lineClamp={2}>
                {latestUpdate.title}
              </Text>
            </span>
            <IconChevronRight size={18} aria-hidden style={{ flexShrink: 0, opacity: 0.5 }} />
          </Link>
        </div>
      )}

      <div>
        <SectionLabel>Công cụ và bài đọc</SectionLabel>
        <SimpleGrid cols={Math.max(1, Math.min(3, tiles.length))} spacing="sm">
          {tiles.map(({ href, label, hint, Icon, section }) => (
            <Link key={href + label} href={href} className="home-tile">
              <span className="section-icon section-icon--sm" data-section={section} aria-hidden>
                <Icon size={24} />
              </span>
              <Text fw={700} size="sm" lh={1.25}>
                {label}
              </Text>
              <Text size="xs" c="dimmed" lh={1.3}>
                {hint}
              </Text>
            </Link>
          ))}
        </SimpleGrid>
      </div>

      {/*
        Nhạc nền và tài khoản đứng CUỐI: đăng nhập một lần rồi thôi, đổi nền vài
        tháng một lần — không thứ nào đáng đứng trên nút Học tiếp. Chưa đăng nhập
        thì thẻ tài khoản nói rõ mất gì (không lưu được tick), nhưng vẫn không chặn
        đường: Chương 0 và Chương 1 vốn miễn phí, không đăng nhập vẫn đọc và tập được.
      */}
      <div>
        <SectionLabel>Cài đặt</SectionLabel>
        <Stack gap="sm">
          <AmbientControl />
          <AccountCard user={user} />
        </Stack>
      </div>
    </Stack>
  );
}
