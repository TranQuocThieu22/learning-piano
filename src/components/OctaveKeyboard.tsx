'use client';

import { Box } from '@mantine/core';
import {
  BLACK_HEIGHT, LABEL_HEIGHT, pianoLayout, WHITE_HEIGHT,
} from '@/lib/piano-keyboard';

const layout = pianoLayout();

/**
 * Bàn phím 88 phím để chọn quãng tập.
 *
 * Vì sao vẽ **đủ cả 88 phím** chứ không chỉ mấy quãng chọn được: người học đang
 * ngồi trước cây đàn thật, và thứ họ cần trả lời là "chỗ này trên đàn là chỗ
 * nào". Một dãy nút chữ không trả lời được câu đó; hình cây đàn thì trả lời ngay
 * — quãng trầm nằm phía trái, quãng cao nằm phía phải, Đô giữa nằm giữa.
 *
 * Quãng nào khóa đang chọn không đọc nổi thì để xám và không bấm được, chứ không
 * giấu đi: giấu thì bàn phím ngắn lại và người học mất luôn cái mốc vị trí.
 *
 * Màu xanh tô đúng những nốt **thật sự đang được hỏi** — nên bật tắt dấu hoá hay
 * thế tay 5 ngón là thấy ngay trên hình, không phải đoán.
 */
export function OctaveKeyboard({
  activeMidis,
  selectedOctaves,
  selectableOctaves,
  onToggle,
}: {
  /** Những nốt đang nằm trong kho câu hỏi — tô xanh đúng các phím này. */
  activeMidis: Set<number>;
  selectedOctaves: number[];
  selectableOctaves: number[];
  onToggle: (octave: number) => void;
}) {
  const labelY = WHITE_HEIGHT + LABEL_HEIGHT * 0.75;

  return (
    <Box
      style={{
        background: '#fff',
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 12,
        padding: '8px 6px 4px',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width="100%"
        style={{ display: 'block', touchAction: 'manipulation' }}
        role="group"
        aria-label="Chọn quãng để tập"
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
            pointerEvents="none"
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
            pointerEvents="none"
          />
        ))}

        {/* Quãng không đọc được ở khóa đang chọn: phủ một lớp xám mờ. */}
        {layout.octaves.filter((o) => !selectableOctaves.includes(o.octave)).map((block) => (
          <rect
            key={`off-${block.octave}`}
            x={block.x}
            y={0}
            width={block.width}
            height={WHITE_HEIGHT}
            fill="var(--mantine-color-gray-2)"
            opacity={0.72}
            pointerEvents="none"
          />
        ))}

        {/* Ba phím lẻ ở hai đầu đàn không thuộc quãng nào — cũng phủ xám cho thống nhất. */}
        <rect x={0} y={0} width={layout.octaves[0].x} height={WHITE_HEIGHT}
          fill="var(--mantine-color-gray-2)" opacity={0.72} pointerEvents="none" />
        <rect
          x={layout.octaves.at(-1)!.x + layout.octaves.at(-1)!.width}
          y={0}
          width={layout.width - (layout.octaves.at(-1)!.x + layout.octaves.at(-1)!.width)}
          height={WHITE_HEIGHT}
          fill="var(--mantine-color-gray-2)"
          opacity={0.72}
          pointerEvents="none"
        />

        {layout.octaves.map((block) => {
          const selectable = selectableOctaves.includes(block.octave);
          const selected = selectedOctaves.includes(block.octave);
          return (
            <g key={block.octave}>
              {/* Viền quanh cụm đang chọn, để thấy được ranh giới cụm ngay cả khi
                  chỉ có năm nốt trong cụm được tô xanh (thế tay 5 ngón). */}
              <rect
                x={block.x}
                y={0}
                width={block.width}
                height={WHITE_HEIGHT}
                fill="none"
                stroke={selected ? 'var(--mantine-color-teal-7)' : 'transparent'}
                strokeWidth={0.14}
                pointerEvents="none"
              />
              <text
                x={block.x + block.width / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={block.octave === 4 ? 0.78 : 0.9}
                fontWeight={selected ? 700 : 400}
                fill={selectable ? (selected ? 'var(--mantine-color-teal-8)' : '#5d5878') : '#a19bb9'}
                pointerEvents="none"
              >
                {block.octave === 4 ? 'Đô giữa' : `Đô${block.octave}`}
              </text>
              {/*
                Vùng bấm phủ trọn cụm: trên điện thoại mỗi cụm rộng khoảng 50px,
                đủ to để chạm bằng ngón cái. Bấm từng phím một thì mỗi phím chỉ
                còn 7px — không ai chạm trúng.
              */}
              {selectable && (
                <rect
                  x={block.x}
                  y={0}
                  width={block.width}
                  height={WHITE_HEIGHT + LABEL_HEIGHT}
                  fill="transparent"
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={`Quãng ${block.octave}`}
                  tabIndex={0}
                  data-testid={`octave-${block.octave}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onToggle(block.octave)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggle(block.octave);
                    }
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Vạch mảnh dưới phím trắng cho ra dáng cây đàn, vẽ cuối để nằm trên cùng. */}
        <line x1={0} y1={BLACK_HEIGHT} x2={layout.width} y2={BLACK_HEIGHT}
          stroke="#d9d5e7" strokeWidth={0.03} pointerEvents="none" />
      </svg>
    </Box>
  );
}
