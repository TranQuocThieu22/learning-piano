/**
 * Điểm vào duy nhất của schema.
 *
 * Mọi nơi trong ứng dụng import từ `@/db/schema`, không ai import thẳng file
 * con — nhờ vậy chia lại ranh giới bên trong không đụng tới chỗ nào khác.
 * `src/db/index.ts` cũng gom cả module này (`import * as schema`) để đưa cho
 * Drizzle, nên một bảng quên re-export ở đây là Drizzle không nhìn thấy nó.
 *
 * Ranh giới tách theo mảng nghiệp vụ chứ không phải mỗi bảng một file, vì hai
 * nhóm dưới đây vốn không tách rời được:
 *
 * - `auth`    — bốn bảng do @auth/drizzle-adapter quy định. Đây là một hợp đồng
 *               với thư viện ngoài, nâng cấp adapter là sửa cả bốn cùng lúc.
 * - `payment` — ba bảng có vòng đời khác nhau, và chính sự khác nhau đó mới là
 *               thứ cần giải thích. Lời giải thích ấy nằm ở đầu payment.ts.
 */
export * from './auth';
export * from './progress';
export * from './payment';
