'use client';

import { Box, Text } from '@mantine/core';
import { shortNoteName } from '@/lib/midi-notes';
import {
  DIAGRAM_KEY_BOTTOM, DIAGRAM_LABEL_HEIGHT, DIAGRAM_LABEL_SIZE, KeyboardDiagramError,
  keyboardDiagram, parseKeysBlock,
} from '@/lib/keyboard-diagram';

/**
 * Hình minh hoạ một thế bấm, vẽ từ khối ```keys trong bài học.
 *
 * Ba điều giữ cho nó đọc được trên điện thoại đặt trên giá nhạc, cách mắt nửa
 * sải tay — đừng sửa mất:
 *
 * 1. **Phím đang bấm có cả màu lẫn CHỮ.** Chỉ tô màu thì người mù màu và người
 *    nhìn qua ở xa đều mất thông tin; tên nốt nằm ngay dưới phím là thứ đọc được
 *    trong một giây.
 * 2. **Chữ đặt dưới bàn phím, không đặt trong phím.** Phím đen hẹp 0,58 đơn vị,
 *    nhét "Sol♯" vào là chữ tràn ra hai bên.
 * 3. **Nền trắng, như giấy nhạc.** Trùng với hình bàn phím ở bài luyện nhận nốt
 *    và với khung bản nhạc, để cả app chỉ có một kiểu "hình về cây đàn".
 */
export function KeyboardDiagram({ spec }: { spec: string }) {
  let block;
  try {
    block = parseKeysBlock(spec);
  } catch (e) {
    /*
     * Hiện lỗi ra màn hình thay vì bỏ qua: khối viết sai mà im lặng biến mất là
     * thứ người soạn bài không bao giờ phát hiện. `keyboard-diagram.test.ts` gác
     * sẵn toàn bộ giáo trình nên chỗ này gần như không bao giờ chạy — nó chỉ
     * dành cho lúc đang soạn dở.
     */
    const message = e instanceof KeyboardDiagramError ? e.message : 'không đọc được';
    return (
      <Text size="sm" c="red" data-testid="keys-error">
        Khối hình bàn phím viết sai: {message}
      </Text>
    );
  }

  const diagram = keyboardDiagram(block.midis);
  const pressed = diagram.keys.filter((k) => k.pressed);
  const tenNot = pressed.map((k) => shortNoteName(k.midi));

  return (
    <Box mb="md">
      <Box
        style={{
          background: '#fff',
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 12,
          padding: '10px 8px 6px',
          // Chặn kính lúp và menu chọn chữ của điện thoại: ngón tay đặt lên hình
          // đàn là để nhìn, không phải để bôi đen chữ.
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          width="100%"
          style={{ display: 'block' }}
          role="img"
          aria-label={`Thế bấm trên đàn: ${tenNot.join(', ')}`}
          data-testid="keyboard-diagram"
        >
          {/* Phím trắng trước, phím đen vẽ đè lên sau — đúng thứ tự của cây đàn thật. */}
          {diagram.keys.filter((k) => !k.black).map((key) => (
            <rect
              key={key.midi}
              x={key.x}
              y={0}
              width={key.width}
              height={key.height}
              rx={0.08}
              fill={key.pressed ? 'var(--mantine-color-teal-4)' : '#fff'}
              stroke="#8d8aa0"
              strokeWidth={0.04}
            />
          ))}
          {diagram.keys.filter((k) => k.black).map((key) => (
            <rect
              key={key.midi}
              x={key.x}
              y={0}
              width={key.width}
              height={key.height}
              rx={0.06}
              fill={key.pressed ? 'var(--mantine-color-teal-7)' : '#2b2733'}
            />
          ))}

          {/* Tên nốt dưới mỗi phím đang bấm. */}
          {pressed.map((key) => (
            <text
              key={`ten-${key.midi}`}
              x={key.centerX}
              y={DIAGRAM_KEY_BOTTOM + DIAGRAM_LABEL_HEIGHT * 0.82}
              textAnchor="middle"
              fontSize={DIAGRAM_LABEL_SIZE}
              fontWeight={700}
              fill="#2b2733"
            >
              {shortNoteName(key.midi)}
            </text>
          ))}
        </svg>
      </Box>

      {block.caption && (
        <Text size="sm" c="dimmed" ta="center" mt={6}>
          {block.caption}
        </Text>
      )}
    </Box>
  );
}
