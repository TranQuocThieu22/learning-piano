'use client';

import { useMemo, useRef, useState } from 'react';
import { Alert, Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconArrowRight, IconCheck, IconHandFinger } from '@tabler/icons-react';
import { useSheetRender } from '@/hooks/useSheetRender';
import { noteAt } from '@/lib/midi-notes';
import {
  barNumbers,
  drillAbc,
  fingerFor,
  keysOf,
  moveKindInfo,
  planHandMoves,
  POSITION_DRILLS,
  positionChoices,
  positionName,
  type HandPosition,
} from '@/lib/hand-position';
import type { HandName } from '@/lib/exercise-gen';

/**
 * **Bài luyện "đặt tay ở đâu".**
 *
 * Trả lời đúng một câu hỏi mà giáo trình bỏ trống: bản nhạc đi ra ngoài năm nốt
 * Đô–Sol thì đặt tay chỗ nào, và dời tay ở đâu. Luật nằm hết ở
 * `src/lib/hand-position.ts`; ở đây chỉ có phần vẽ.
 *
 * Ba điều giữ cho nó không thành một app chấm điểm — cùng ràng buộc với bài
 * luyện nhận nốt, xem `AGENTS.md`:
 *
 * 1. **Không đếm giờ, không tính điểm.** Người học nhìn bản nhạc bao lâu tuỳ ý,
 *    và chọn sai cũng không mất gì — đáp án hiện ra kèm lý do, đó mới là bài học.
 * 2. **Đáp án là một lời giải thích, không phải một chữ Đúng/Sai.** Chọn xong
 *    mới hiện số ngón trên bản nhạc, hình bàn phím cho từng thế tay, và câu nói
 *    vì sao dời tay ở đúng chỗ đó.
 * 3. **Không cần đàn, không cần cho app nghe.** Đây là bài tập cho MẮT, làm được
 *    lúc ngồi xe buýt. Việc của tay đã có các bài trong giáo trình lo.
 */

/**
 * Hàng năm ngón của một thế tay: số ngón kèm tên nốt.
 *
 * Cố ý KHÔNG dùng `KeyboardDiagram` dù đã có sẵn: hình bàn phím ở đó vẽ cho một
 * thế BẤM hợp âm, phóng to vừa đúng mấy phím được bấm — với năm phím trắng nó
 * chiếm trọn màn hình điện thoại, mà một câu có tới ba thế tay. Thứ người học
 * cần ở đây cũng khác: không phải hình dạng bàn tay, mà là **ngón nào ăn nốt
 * nào**, và cái đó đọc nhanh nhất ở dạng một hàng.
 */
function FingerRow({ pos, hand }: { pos: HandPosition; hand: HandName }) {
  return (
    <Group gap={6} wrap="wrap" mb="xs">
      {keysOf(pos).map((midi) => (
        <Badge
          key={midi}
          size="lg"
          variant="light"
          color="grape"
          // Mantine viết hoa toàn bộ nhãn theo mặc định, mà "PHA" thì không còn là
          // cách viết tên nốt của giáo trình nữa.
          tt="none"
          leftSection={<b>{fingerFor(pos, midi, hand)}</b>}
        >
          {noteAt(midi).name}
        </Badge>
      ))}
    </Group>
  );
}

export function HandPositionDrill() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const drill = POSITION_DRILLS[index % POSITION_DRILLS.length];
  const plan = useMemo(() => planHandMoves(drill.notes, drill.hand), [drill]);
  const dapAn = plan.segments[0].position;
  const choices = useMemo(() => positionChoices(dapAn), [dapAn]);

  /*
   * Số ngón chỉ hiện SAU khi đã chọn. Hiện sẵn thì câu hỏi tự trả lời mất — mà
   * việc phải tập ở đây đúng là nhìn bản nhạc trơn rồi tự quyết.
   */
  const abc = useMemo(
    () => drillAbc(drill, chosen === null ? undefined : plan.fingers),
    [drill, chosen, plan],
  );
  useSheetRender(paperRef, abc);

  const dungRoi = chosen === dapAn.anchor;
  /** Ô nhịp của từng nốt, để nói được "dời tay ở ô nhịp thứ mấy". */
  const oNhipCua = useMemo(() => barNumbers(drill.notes), [drill]);

  const cauTiep = () => {
    setIndex((i) => i + 1);
    setChosen(null);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm" c="dimmed">
          Câu {(index % POSITION_DRILLS.length) + 1}/{POSITION_DRILLS.length}
        </Text>
        <Badge variant="light" color={drill.hand === 'right' ? 'grape' : 'teal'}>
          {drill.hand === 'right' ? 'Tay phải' : 'Tay trái'}
        </Badge>
      </Group>

      <Card withBorder padding="sm" radius="md">
        {/*
          `color: '#000'` KHÔNG phải cho đẹp, nó là thứ bắt buộc: abcjs vẽ nốt
          bằng `currentColor`. Thiếu nó thì ở nền tối, khung giấy trắng thừa
          hưởng màu chữ gần trắng và cả bản nhạc mờ tịt trên nền trắng — nhìn
          như hỏng màn hình. Nền sáng vẫn đẹp nên chụp màn hình ở nền sáng không
          bao giờ thấy. Khung bản nhạc bài học và bài luyện nhận nốt đều ép cứng
          hai màu này, đây là chỗ duy nhất từng quên.
        */}
        <Box
          ref={paperRef}
          style={{ background: '#fff', color: '#000', borderRadius: 8, padding: 4 }}
        />
      </Card>

      {chosen === null ? (
        <Stack gap="xs">
          <Text fw={600}>
            {drill.hand === 'right'
              ? 'Đặt ngón cái ở nốt nào?'
              : 'Nốt thấp nhất của thế tay (ngón 5) là nốt nào?'}
          </Text>
          <Text size="sm" c="dimmed">
            Nhìn nốt thấp nhất và nốt cao nhất của cả câu trước đã — đừng đọc từng nốt một.
          </Text>
          {/*
            Nút xếp dọc, mỗi nút cao trọn một hàng: máy đang nằm trên giá nhạc
            cách mắt nửa sải tay, bấm bằng ngón cái, nên bốn nút nhỏ xếp ngang là
            bấm trượt.
          */}
          <Stack gap={8} mt={4}>
            {choices.map((pos) => (
              <Button
                key={pos.anchor}
                size="md"
                variant="default"
                justify="flex-start"
                leftSection={<IconHandFinger size={18} />}
                onClick={() => setChosen(pos.anchor)}
              >
                {positionName(pos)}
              </Button>
            ))}
          </Stack>
        </Stack>
      ) : (
        <Stack gap="md">
          <Alert
            color={dungRoi ? 'teal' : 'orange'}
            icon={dungRoi ? <IconCheck size={18} /> : undefined}
            title={dungRoi ? 'Đúng rồi' : `Đáp án: ${positionName(dapAn)}`}
          >
            <Text size="sm">{drill.point}</Text>
          </Alert>

          {plan.segments.map((seg, i) => {
            const move = plan.moves.find((m) => m.atIndex === seg.from);
            const oNhip = oNhipCua[seg.from];
            const oCuoi = oNhipCua[seg.to];
            return (
              <Card key={seg.from} withBorder padding="md" radius="md">
                <Text fw={700} size="sm">
                  {i + 1}. {positionName(seg.position)}
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  {oNhip === oCuoi ? `Ô nhịp ${oNhip}` : `Ô nhịp ${oNhip}–${oCuoi}`}
                </Text>

                <FingerRow pos={seg.position} hand={drill.hand} />

                {seg.stretched.length > 0 && (
                  <Text size="sm">
                    <b>Với thêm ngón:</b> nốt{' '}
                    {seg.stretched.map((m) => noteAt(m).name).join(', ')} nằm ngoài thế tay —
                    duỗi ngón ra lấy rồi thu về, giữ nguyên cả bàn tay.
                  </Text>
                )}

                {move && (
                  <Text size="sm">
                    <b>Vào thế này bằng cách:</b> {moveKindInfo(move.kind).how}
                    {move.gap !== null && (
                      <>
                        {' '}
                        Chỗ dời là <b>đầu ô nhịp {oNhip}</b>,{' '}
                        {move.gap === 'lang'
                          ? 'ngay sau dấu lặng'
                          : 'trong lúc nốt trước còn đang ngân'}{' '}
                        — tay rảnh đúng lúc đó.
                      </>
                    )}
                  </Text>
                )}
              </Card>
            );
          })}

          {plan.moves.length === 0 && (
            <Text size="sm" c="dimmed">
              Cả câu chỉ cần một thế tay. Đặt tay một lần rồi để yên — đó là điều tốt nhất
              có thể xảy ra với một câu nhạc.
            </Text>
          )}

          <Button size="md" onClick={cauTiep} rightSection={<IconArrowRight size={18} />}>
            Câu tiếp theo
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
