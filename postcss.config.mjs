/**
 * Gán vào biến rồi mới export, thay vì export thẳng object vô danh.
 *
 * Không phải sở thích: `import/no-anonymous-default-export` cảnh báo ở đây, mà
 * một cảnh báo tồn tại mãi thì dạy người ta bỏ qua toàn bộ output của lint. Giữ
 * `pnpm lint` sạch tuyệt đối để nó còn dùng được làm cổng kiểm tra.
 */
const postcssConfig = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};

export default postcssConfig;
