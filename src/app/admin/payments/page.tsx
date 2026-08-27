import { Alert, Text, Title } from '@mantine/core';
import { listOrders, listPayments, needsAttention } from '@/lib/admin-data';
import { formatVnd } from '@/lib/payment/vietqr';
import {
  AdminOrdersTable,
  AdminPaymentsTable,
  type OrderRowView,
  type PaymentRowView,
} from '@/components/admin/AdminPaymentTables';

export const metadata = { title: 'Quản trị — Thanh toán' };

export const dynamic = 'force-dynamic';

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Trang này chỉ lấy dữ liệu và định dạng sẵn; phần bảng nằm ở client component.
 *
 * Bắt buộc như vậy vì Mantine là client component: `Table.Tbody` truy cập từ
 * Server Component trả về undefined và trang trả 500. Trước đây trang này dựng
 * bảng ngay tại chỗ nên hỏng — chỉ không ai phát hiện vì chưa có giao dịch nào
 * để vào xem.
 */
export default async function AdminPaymentsPage() {
  const [payments, orders] = await Promise.all([listPayments(), listOrders()]);
  const attention = payments.filter((p) => needsAttention(p) !== null);

  const paymentRows: PaymentRowView[] = payments.map((p) => ({
    id: p.id,
    luc: formatTime(p.receivedAt),
    soTien: formatVnd(p.amountVnd),
    nguoiMua: p.buyerEmail ?? '—',
    maChuyenKhoan: p.orderTransferCode ?? '—',
    noiDungTho: p.rawContent ?? '—',
    canXuLy: needsAttention(p),
  }));

  const orderRows: OrderRowView[] = orders.map((o) => ({
    id: o.id,
    taoLuc: formatTime(o.createdAt),
    nguoiMua: o.buyerEmail ?? '—',
    goi: o.packageId,
    soTien: formatVnd(o.amountVnd),
    maChuyenKhoan: o.transferCode,
    trangThai: (o.status === 'paid' || o.status === 'cancelled'
      ? o.status
      : 'pending') as OrderRowView['trangThai'],
  }));

  return (
    <>
      {attention.length > 0 && (
        <Alert color="orange" title="Có giao dịch cần bạn xử lý tay" mb="lg">
          {attention.length} giao dịch chưa tự động xử lý được. Xem cột &quot;Cần xử
          lý&quot; bên dưới.
        </Alert>
      )}

      <Title order={4} mb="sm">
        Giao dịch đã nhận
      </Title>
      {paymentRows.length === 0 ? (
        <Text c="dimmed" size="sm" mb="xl">
          Chưa nhận được giao dịch nào.
        </Text>
      ) : (
        <AdminPaymentsTable rows={paymentRows} />
      )}

      <Title order={4} mb="sm">
        Đơn hàng
      </Title>
      {orderRows.length === 0 ? (
        <Text c="dimmed" size="sm">
          Chưa có đơn nào.
        </Text>
      ) : (
        <AdminOrdersTable rows={orderRows} />
      )}
    </>
  );
}
