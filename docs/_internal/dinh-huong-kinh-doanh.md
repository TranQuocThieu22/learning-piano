# Định hướng sản phẩm và kinh doanh

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**
> Thư mục `_internal` nằm ngoài danh sách `contentDirs` trong `src/lib/markdown.ts`
> nên không xuất hiện trên thanh điều hướng. Đây là ghi chép cho người phát triển,
> không phải nội dung cho người học.
>
> **Cập nhật lần cuối:** 22/08/2026
>
> **Mức độ tin cậy:** Các con số về giá và thị trường là **suy luận** từ dữ liệu
> tham khảo công khai, chưa được kiểm chứng bằng doanh số thật. Phần pháp lý cần
> hỏi lại người có chuyên môn trước khi áp dụng.

---

## 1. Sản phẩm này là gì, và không là gì

**Là:** giáo trình piano tiếng Việt có cấu trúc, dạy kỹ thuật vật lý trên **đàn thật**, giải thích *vì sao* chứ không chỉ *làm gì*, kèm công cụ hỗ trợ (máy đánh nhịp, trình phát bản nhạc, theo dõi tiến độ).

**Không là:** kho bài hát, app chơi game hóa, hay công cụ thay thế đàn thật.

**Lợi thế cạnh tranh thật sự nằm ở đâu.** Không phải ở số lượng tính năng — về mặt đó ta thua xa các app quốc tế. Lợi thế là **tiếng Việt + giải thích nguyên nhân + phương pháp tập xa đàn**. Người mới ở Việt Nam vật lộn với app tiếng Anh, và hầu hết khóa học Việt chỉ liệt kê thao tác chứ không giải thích lý do.

**Điểm yếu phải thừa nhận.** Chưa có video quay tay. Chưa có chấm điểm tự động. Nội dung dạng chữ nên **cực dễ bị sao chép** — một người mua chụp màn hình là phát tán được toàn bộ. Đây là lập luận mạnh nhất cho việc ưu tiên làm **Web MIDI**: tính năng tương tác là thứ duy nhất không copy được.

## 2. Bối cảnh thị trường (tham khảo, 2026)

| Phân khúc | Mức giá |
|---|---|
| Học 1 kèm 1 online (giáo viên thật, VN) | 500k – 5tr / tháng |
| Học nhóm (VN) | 1,5tr – 6tr / tháng |
| App tự học quốc tế (Flowkey, Simply Piano...) | ~2,3tr – 4,4tr / năm |

Ta **không cạnh tranh trực tiếp** với nhóm có giáo viên thật (khác hẳn về bản chất dịch vụ), và **không nên định giá ngang** app quốc tế khi còn thiếu video lẫn chấm điểm.

## 3. Mô hình kinh doanh đã chốt

**Freemium + mua đứt.** Không dùng thuê bao.

**Vì sao không thuê bao:** nội dung hữu hạn (Giai đoạn 1 khoảng 60 ngày). Thuê bao cho sản phẩm có điểm kết thúc dẫn tới hai kết cục đều xấu — người học nhanh thì hủy ngay, người học chậm thì thấy bị ép trả tiền cho thời gian thay vì giá trị. Thuê bao chỉ hợp lý khi nội dung sinh thêm liên tục hoặc có dịch vụ diễn ra liên tục.

**Vị trí khóa (paywall): hết Chương 1.**

Không khóa sau Bài 1 — người học mới bỏ ra 15 phút, chưa đủ đầu tư để tiếc, và chưa kịp thấy sản phẩm hay ở đâu. Không mở tới hết Chương 2 — cho đi quá nhiều. Hết Chương 1 là điểm cân bằng: người học đã tập 3-5 ngày, tay đã quen phím, đã tick được vài bài, và Chương 2 (ghép hai tay) đúng là chỗ giá trị bắt đầu rõ.

## 4. Cấu trúc gói và giá

**Nguyên tắc: mỗi gói phải tự nó trọn vẹn.** Ranh giới giữa "bán rời hợp lý" và "moi tiền lắt nhắt" nằm ở đây. Giai đoạn 1-2 phải kết thúc ở một đích đến thật — người học **tự đệm được một bài hát hoàn chỉnh** — chứ không cắt ngang kiểu "muốn biết tiếp thì mua gói sau".

| Gói | Nội dung | Giá | Trạng thái |
|---|---|---|---|
| **Nền tảng** | Giai đoạn 1 + 2 | **399.000đ** mua đứt | Chưa mở bán |
| **Nâng cao** | Giai đoạn 3 | 500k – 700k | Chưa soạn |
| **Cảm âm & Ứng tấu** | Giai đoạn 4 | 500k – 700k | Chưa soạn |
| **Trọn bộ** | Cả 4 giai đoạn | 1,2 – 1,5tr | Chỉ khi cả 4 đã xong |

**Vì sao 399k chứ không phải 699k.** Ở ngưỡng 300-400k người mua quyết định nhanh, ít so đo. Lên 699k thì họ bắt đầu so với việc học giáo viên thật. Quan trọng hơn: ở giai đoạn ra mắt, mục tiêu **không phải tối đa lợi nhuận mỗi người** mà là **có đủ người dùng thật để phát hiện lỗi và đo được tỷ lệ hoàn thành**.

**Vì sao gói nâng cao lại đắt hơn gói nền tảng.** Người mua Giai đoạn 3 đã trả tiền một lần và đã học được thật — rào cản niềm tin gần như bằng không, đây là nhóm khách dễ bán nhất. Nội dung nâng cao cũng khó soạn hơn và ít nơi làm hơn nên ít bị so giá.

**Giai đoạn 3 và 4 tách hẳn thành sản phẩm riêng.** Ba lý do: chúng phục vụ tệp khách khác (người đã chơi vài tháng, ít hơn nhưng chịu chi hơn); tách ra thì Giai đoạn 1-2 là sản phẩm **giao đủ, hết trách nhiệm**, không mắc nợ lời hứa; và nếu số liệu cho thấy quá ít người đi hết Giai đoạn 2 thì có quyền **không làm** Giai đoạn 3-4 mà không phá vỡ cam kết nào.

**Chỉ quảng bá Giai đoạn 3-4 khi đã làm xong.** Không liệt kê trong bảng giá kèm chữ "sắp ra mắt" — vừa tạo kỳ vọng phải trả, vừa khiến người ta chần chừ chờ mua trọn bộ.

## 5. Lộ trình tăng giá

Tăng giá là công cụ marketing hợp lệ **miễn là tăng thật**.

- Ra mắt: 399k, công bố rõ đây là giá ưu đãi ra mắt trong X tháng đầu.
- Khi Giai đoạn 2 hoàn thiện: tăng lên khoảng 599k, thông báo trước.
- Người đã mua giữ nguyên quyền truy cập, không bị thu thêm.

## 6. Những điều TUYỆT ĐỐI KHÔNG làm

**Không bịa "giá gốc" gạch ngang.** Niêm yết "giá gốc 1.200.000đ" cho sản phẩm chưa từng bán ở giá đó là **quảng cáo sai sự thật**. Khuyến mại ở Việt Nam chịu điều chỉnh của **Nghị định 81/2018** (sửa đổi bởi **Nghị định 128/2024**): mức giảm bị khống chế theo giá **ngay trước thời điểm khuyến mại**, và phải **thông báo Sở Công Thương trước ít nhất 3 ngày làm việc**. Chế tài có thể gồm phạt tiền và đình chỉ tên miền.

**Không dùng đồng hồ đếm ngược giả lập.** Nếu có đếm ngược thì phải là hạn thật, và hết hạn là giá phải đổi thật.

**Không chạy thương mại trên gói Vercel Hobby.** Gói miễn phí cấm dùng thương mại. Rủi ro không phải bị phạt mà là **tài khoản bị đình chỉ đột ngột** — website sập và **khách đã trả tiền mất quyền truy cập**. Đã quyết định thu tiền thì mua gói Pro ngay từ đơn hàng đầu tiên.

**Không hứa "cập nhật miễn phí trọn đời" cho nội dung chưa tồn tại.** Doanh thu đến một lần, nghĩa vụ kéo dài vô hạn — đây là cách các khóa học online chết dần.

## 7. Nghĩa vụ pháp lý và vận hành

- **Chính sách hoàn tiền** (đề xuất 7 ngày) — vừa tạo niềm tin để chốt đơn, vừa gần như bắt buộc khi tích hợp cổng thanh toán.
- **Đăng ký kinh doanh và thuế** — doanh thu bán hàng online là thu nhập chịu thuế, kể cả khi nhận qua chuyển khoản thủ công.
- **Điều khoản sử dụng** nêu rõ tài khoản dùng cho cá nhân, không chia sẻ.
- Giai đoạn đầu có thể thu tiền bằng **QR chuyển khoản + mở khóa thủ công**, nhưng phải có quy trình xử lý khi khách chuyển tiền mà chưa được mở khóa.

## 8. Chỉ số quyết định — đo trước khi tính doanh thu

**Con số duy nhất đáng quan tâm lúc này: trong 20-30 người học thật đầu tiên, bao nhiêu người đi hết Chương 1?**

Học piano có tỷ lệ bỏ cuộc rất cao ở tuần thứ hai. Trong mô hình khóa ở hết Chương 1, người học phải tập đều vài ngày mới **chạm tới** paywall — phần lớn người đăng ký sẽ không bao giờ đi đến đó. Mọi dự báo doanh thu tính theo "số người đăng ký × tỷ lệ chuyển đổi" đều vô nghĩa nếu bỏ qua bước rơi rụng này.

Nếu dưới một nửa số người thử đi hết Chương 1 thì vấn đề nằm ở **sản phẩm**, không phải ở marketing, và chưa nên tiêu tiền quảng cáo.

**Cảnh giác với các mô hình doanh thu vẽ sẵn.** Tỷ lệ chuyển đổi freemium 2-3% thường được trích cho sản phẩm mà bản miễn phí đã là phần mềm dùng được ngay. Khóa học đòi hỏi tập luyện hàng ngày mới tới được paywall thì không so sánh trực tiếp được. Ngoài ra cần phân biệt rõ **lượt truy cập** và **người đăng ký thật** — hai con số cách nhau cả chục lần.

## 9. Thứ tự ưu tiên trước khi thu tiền

1. **Hoàn thiện Chương 5 và 6** — bán một khóa còn dang dở là rủi ro uy tín lớn nhất.
2. **Soạn Giai đoạn 2** — vì đây mới là thứ người học khao khát (tự đệm được bài hát yêu thích).
3. **Web MIDI chấm điểm** — thứ duy nhất không sao chép được, và là điều kiện để định giá ngang tầm app quốc tế.
4. Video ngắn quay tay cho các bài kỹ thuật.
5. Phân quyền theo gói, cổng thanh toán, chính sách hoàn tiền.

Chỉ nên bắt đầu thu tiền sau bước 1 và 2.

## 10. Điều kiện xem xét lại tài liệu này

- Sau khi có **50 người dùng thật** và biết tỷ lệ hoàn thành Chương 1.
- Khi Giai đoạn 2 hoàn thiện (xem lại mức giá).
- Khi Web MIDI chạy ổn định (xem lại toàn bộ mô hình — lúc đó thuê bao mới có thể hợp lý).
- Nếu xuất hiện đối thủ tiếng Việt trực tiếp.

---

## Nguồn tham khảo

- [Các khóa học piano bao nhiêu tiền — Piano Đức Trí](https://pianoductri.com/blog/khoa-hoc-piano-bao-nhieu-tien/)
- [Học phí khóa học piano online — Thu Nhạc](https://thunhac.com/hoc-phi-khoa-hoc-piano-online-gia-bao-nhieu-tien-co-dat-khong)
- [Piano app pricing compared 2026 — ArtMaster](https://www.artmaster.com/articles/what-piano-apps-actually-cost-in-2026)
- [Giám sát, chế tài khuyến mãi trái quy định — Người Lao Động](https://tuoitre.vn/nld/giam-sat-che-tai-khuyen-mai-trai-quy-dinh-196241108210734739.htm)
- [Nghị định 98/2020/NĐ-CP về xử phạt vi phạm hành chính trong hoạt động thương mại — VCCI](https://vcci.com.vn/legal-document/nghi-dinh-982020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-trong-hoat-dong-thuong-mai-san-xuat-buon-ban-hang-gia-hang-cam-va-bao-ve-quyen-loi-nguoi-tieu-dung)
