/**
 * Đổi tốc độ phát của bản nhạc mẫu ra số nhịp mỗi phút.
 *
 * Tách thành hàm thuần nhận ba con số, không nhận đối tượng bản nhạc của abcjs:
 * đây là phép tính duy nhất trong phần xem bản nhạc, và tách ra thì nó chạy được
 * trong vitest (`environment: 'node'`, không có DOM) thay vì phải dựng cả một
 * bản nhạc thật mới kiểm được một phép chia.
 */

/**
 * `warp` là phần trăm tốc độ: 100 là đúng tốc độ ghi trong bản nhạc, 50 là chậm
 * một nửa. Công thức chép đúng cách abcjs tính trong `SynthController.go`, nên
 * con số hiện trên màn hình khớp với tiếng thật sự phát ra.
 *
 * Trả về 0 khi các con số đưa vào không dùng được (bản nhạc chưa dựng xong, hoặc
 * tốc độ bằng 0). Hiện 0 thì người học thấy ngay là chưa có số; ném lỗi ở đây thì
 * vỡ cả khung xem bản nhạc chỉ vì một dòng chữ nhỏ.
 */
export function bpmAtWarp(msPerMeasure: number, beatsPerMeasure: number, warp: number): number {
  if (!(msPerMeasure > 0) || !(beatsPerMeasure > 0) || !(warp > 0)) return 0;
  const scaled = (msPerMeasure * 100) / warp;
  return Math.round((beatsPerMeasure / scaled) * 60000);
}
