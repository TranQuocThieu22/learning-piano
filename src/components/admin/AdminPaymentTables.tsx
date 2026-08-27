'use client';

import { Badge, Table, Text } from '@mantine/core';

/**
 * Hai bảng của trang quản trị thanh toán.
 *
 * Phải là client component: Mantine là client component, nên truy cập thuộc
 * tính ghép như `Table.Tbody` từ một Server Component trả về undefined và React
 * ném "Element type is invalid" — trang trả 500. Cùng lý do khiến
 * AdminUserTable.tsx cũng là client component.
 *
 * Dữ liệu được định dạng sẵn ở server rồi truyền xuống, để component này không
 * phải đụng tới admin-data.ts (vốn là 'server-only').
 */

export interface PaymentRowView {
  id: string;
  luc: string;
  soTien: string;
  nguoiMua: string;
  maChuyenKhoan: string;
  noiDungTho: string;
  canXuLy: string | null;
}

export interface OrderRowView {
  id: string;
  taoLuc: string;
  nguoiMua: string;
  goi: string;
  soTien: string;
  maChuyenKhoan: string;
  trangThai: 'paid' | 'cancelled' | 'pending';
}

export function AdminPaymentsTable({ rows }: { rows: PaymentRowView[] }) {
  return (
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
          {rows.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>{r.luc}</Table.Td>
              <Table.Td>{r.soTien}</Table.Td>
              <Table.Td>{r.nguoiMua}</Table.Td>
              <Table.Td>{r.maChuyenKhoan}</Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {r.noiDungTho}
                </Text>
              </Table.Td>
              <Table.Td>
                {r.canXuLy ? (
                  <Text size="xs" c="orange">
                    {r.canXuLy}
                  </Text>
                ) : (
                  <Badge color="green" variant="light">
                    Xong
                  </Badge>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

const TRANG_THAI = {
  paid: { color: 'green', nhan: 'Đã trả' },
  cancelled: { color: 'gray', nhan: 'Đã huỷ' },
  pending: { color: 'yellow', nhan: 'Chờ trả' },
} as const;

export function AdminOrdersTable({ rows }: { rows: OrderRowView[] }) {
  return (
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
          {rows.map((r) => {
            const tt = TRANG_THAI[r.trangThai] ?? TRANG_THAI.pending;
            return (
              <Table.Tr key={r.id}>
                <Table.Td>{r.taoLuc}</Table.Td>
                <Table.Td>{r.nguoiMua}</Table.Td>
                <Table.Td>{r.goi}</Table.Td>
                <Table.Td>{r.soTien}</Table.Td>
                <Table.Td>{r.maChuyenKhoan}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={tt.color}>
                    {tt.nhan}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
