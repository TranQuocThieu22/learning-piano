import { Alert, Badge, Table, Text, Title } from '@mantine/core';
import { listOrders, listPayments, needsAttention } from '@/lib/admin-data';
import { formatVnd } from '@/lib/payment/vietqr';

export const metadata = { title: 'Quản trị — Thanh toán' };

export const dynamic = 'force-dynamic';

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default async function AdminPaymentsPage() {
  const [payments, orders] = await Promise.all([listPayments(), listOrders()]);
  const attention = payments.filter((p) => needsAttention(p) !== null);

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
      {payments.length === 0 ? (
        <Text c="dimmed" size="sm" mb="xl">
          Chưa nhận được giao dịch nào.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={860} mb="xl">
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Lúc</Table.Th>
                <Table.Th>Số tiền</Table.Th>
                <Table.Th>Người mua</Table.Th>
                <Table.Th>Mã CK</Table.Th>
                <Table.Th>Nội dung thô</Table.Th>
                <Table.Th>Cần xử lý</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((p) => {
                const problem = needsAttention(p);
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>{formatTime(p.receivedAt)}</Table.Td>
                    <Table.Td>{formatVnd(p.amountVnd)}</Table.Td>
                    <Table.Td>{p.buyerEmail ?? '—'}</Table.Td>
                    <Table.Td>{p.orderTransferCode ?? '—'}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {p.rawContent ?? '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {problem ? (
                        <Text size="xs" c="orange">
                          {problem}
                        </Text>
                      ) : (
                        <Badge color="green" variant="light">
                          Xong
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Title order={4} mb="sm">
        Đơn hàng
      </Title>
      {orders.length === 0 ? (
        <Text c="dimmed" size="sm">
          Chưa có đơn nào.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tạo lúc</Table.Th>
                <Table.Th>Người mua</Table.Th>
                <Table.Th>Gói</Table.Th>
                <Table.Th>Số tiền</Table.Th>
                <Table.Th>Mã CK</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{formatTime(o.createdAt)}</Table.Td>
                  <Table.Td>{o.buyerEmail ?? '—'}</Table.Td>
                  <Table.Td>{o.packageId}</Table.Td>
                  <Table.Td>{formatVnd(o.amountVnd)}</Table.Td>
                  <Table.Td>{o.transferCode}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={
                        o.status === 'paid'
                          ? 'green'
                          : o.status === 'cancelled'
                            ? 'gray'
                            : 'yellow'
                      }
                    >
                      {o.status === 'paid'
                        ? 'Đã trả'
                        : o.status === 'cancelled'
                          ? 'Đã huỷ'
                          : 'Chờ trả'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
