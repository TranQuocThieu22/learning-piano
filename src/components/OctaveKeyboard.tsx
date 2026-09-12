'use client';

import { Box } from '@mantine/core';
import { octaveLabel } from '@/lib/midi-notes';
import {
  BLACK_HEIGHT, LABEL_HEIGHT, pianoLayout, WHITE_HEIGHT,
} from '@/lib/piano-keyboard';

const layout = pianoLayout();

/**
 * Hình cây đàn 88 phím, **chỉ để nhìn** — chọn quãng bằng hàng nút bên dưới.
 *
 * Vì sao không cho chạm thẳng vào đàn: bản đầu làm thế và hỏng ngay trên máy
 * thật. Android thấy ngón tay đặt lên một hình có chữ thì bật **kính lúp chọn
 * chữ**, một cục tròn to đùng che mất nửa bàn phím. Ép tắt được, nhưng cái được
 * lớn hơn là hàng nút thật ở dưới: nút có tên đọc được, bấm trúng chắc chắn, và
 * đọc màn hình cũng hiểu.
 *
 * Nên hình này giữ đúng một việc: **bôi vùng đang tập lên cây đàn**, để người học
 * thấy ngay chỗ mình chọn nằm ở đâu trên đàn thật trước mặt.
 *
 * Hai lớp màu, cố ý khác nhau:
 * - **Cả quãng** phủ một lớp xanh nhạt — đây là vùng đã chọn.
 * - **Từng phím đang được hỏi** tô xanh đậm. Bật thế tay 5 ngón hay tắt dấu hoá
 *   là thấy ngay vùng chọn thì rộng mà số phím thật sự hỏi thì hẹp hơn.
 */
export function OctaveKeyboard({
  activeMidis,
  selectedOctaves,
  selectableOctaves,
}: {
  /** Những nốt đang nằm trong kho câu hỏi — tô đậm đúng các phím này. */
  activeMidis: Set<number>;
  selectedOctaves: number[];
  /** Quãng khóa nhạc đang chọn không đọc được thì để xám. */
  selectableOctaves: number[];
}) {
  const labelY = WHITE_HEIGHT + LABEL_HEIGHT * 0.75;
  const ngoaiCum = [
    { x: 0, width: layout.octaves[0].x },
    {
      x: layout.octaves.at(-1)!.x + layout.octaves.at(-1)!.width,
      width: layout.width - (layout.octaves.at(-1)!.x + layout.octaves.at(-1)!.width),
    },
  ];

  return (
    <Box
      style={{
        background: '#fff',
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 12,
        padding: '8px 6px 4px',
        overflow: 'hidden',
        // Chặn kính lúp và menu chọn chữ của điện thoại: ngón tay đặt lên hình
        // đàn là để nhìn, không phải để bôi đen chữ "Đô giữa".
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width="100%"
        style={{ display: 'block', pointerEvents: 'none' }}
        role="img"
        aria-label={
          selectedOctaves.length > 0
            ? `Vùng đang tập trên đàn: ${selectedOctaves.map(octaveLabel).join(', ')}`
            : 'Chưa chọn quãng nào'
        }
        data-testid="octave-keyboard"
      >
        {/* Phím trắng trước, phím đen vẽ đè lên sau — đúng thứ tự của cây đàn thật. */}
        {layout.keys.filter((k) => !k.black).map((key) => (
          <rect
            key={key.midi}
            x={key.x}
            y={0}
            width={key.width}
            height={key.height}
            rx={0.08}
            fill={activeMidis.has(key.midi) ? 'var(--mantine-color-teal-4)' : '#fff'}
            stroke="#8d8aa0"
            strokeWidth={0.04}
          />
        ))}
        {layout.keys.filter((k) => k.black).map((key) => (
          <rect
            key={key.midi}
            x={key.x}
            y={0}
            width={key.width}
            height={key.height}
            rx={0.06}
            fill={activeMidis.has(key.midi) ? 'var(--mantine-color-teal-7)' : '#2b2733'}
          />
        ))}

        {/* Quãng không đọc được ở khóa đang chọn, và ba phím lẻ ở hai đầu đàn. */}
        {[
          ...layout.octaves.filter((o) => !selectableOctaves.includes(o.octave)),
          ...ngoaiCum.map((v) => ({ octave: -1, ...v })),
        ].map((block, i) => (
          <rect
            key={`off-${block.octave}-${i}`}
            x={block.x}
            y={0}
            width={block.width}
            height={WHITE_HEIGHT}
            fill="var(--mantine-color-gray-2)"
            opacity={0.72}
          />
        ))}

        {layout.octaves.filter((o) => selectedOctaves.includes(o.octave)).map((block) => (
          <g key={`chon-${block.octave}`}>
            {/* Lớp phủ nhạt cho cả quãng: đây mới là "vùng đã chọn". */}
            <rect
              x={block.x}
              y={0}
              width={block.width}
              height={WHITE_HEIGHT}
              fill="var(--mantine-color-teal-5)"
              opacity={0.16}
            />
            <rect
              x={block.x}
              y={0}
              width={block.width}
              height={WHITE_HEIGHT}
              fill="none"
              stroke="var(--mantine-color-teal-7)"
              strokeWidth={0.14}
            />
          </g>
        ))}

        {layout.octaves.map((block) => {
          const selected = selectedOctaves.includes(block.octave);
          const selectable = selectableOctaves.includes(block.octave);
          return (
            <text
              key={`nhan-${block.octave}`}
              x={block.x + block.width / 2}
              y={labelY}
              textAnchor="middle"
              fontSize={block.octave === 4 ? 0.78 : 0.9}
              fontWeight={selected ? 700 : 400}
              fill={selectable ? (selected ? 'var(--mantine-color-teal-8)' : '#5d5878') : '#a19bb9'}
            >
              {octaveLabel(block.octave)}
            </text>
          );
        })}

        {/* Vạch mảnh dưới phím đen cho ra dáng cây đàn, vẽ cuối để nằm trên cùng. */}
        <line x1={0} y1={BLACK_HEIGHT} x2={layout.width} y2={BLACK_HEIGHT}
          stroke="#d9d5e7" strokeWidth={0.03} />
      </svg>
    </Box>
  );
}
