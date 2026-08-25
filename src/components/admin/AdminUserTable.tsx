'use client';
import { useState, useTransition } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { grantAccessAction, revokeAccessAction } from '@/lib/admin-actions';
import type { AdminUserRow } from '@/lib/admin-data';
import type { Package } from '@/lib/packages';

export function AdminUserTable({
  users,
  packages,
}: {
  users: AdminUserRow[];
  packages: Package[];
}) {
  const [granting, setGranting] = useState<AdminUserRow | null>(null);
  const [packageId, setPackageId] = useState(packages[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(work: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await work();
      setMessage(result.message);
      if (result.ok) setGranting(null);
    });
  }

  return (
    <>
      {message && (
        <Text size="sm" mb="sm" c="dimmed">
          {message}
        </Text>
      )}

      <Table.ScrollContainer minWidth={720}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Tên</Table.Th>
              <Table.Th>Bài đã tick</Table.Th>
              <Table.Th>Gói đang có</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{user.name ?? '—'}</Table.Td>
                <Table.Td>{user.lessonsDone}</Table.Td>
                <Table.Td>
                  {user.packages.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Chưa có
                    </Text>
                  ) : (
                    <Group gap={4}>
                      {user.packages.map((id) => (
                        <Badge key={id} variant="light">
                          {id}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="light"
                      disabled={pending}
                      onClick={() => {
                        setMessage(null);
                        setNote('');
                        setGranting(user);
                      }}
                    >
                      Cấp gói
                    </Button>
                    {user.packages.map((id) => (
                      <Button
                        key={id}
                        size="xs"
                        variant="subtle"
                        color="red"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !confirm(
                              `Thu hồi gói "${id}" của ${user.email}? Dùng khi đã hoàn tiền.`
                            )
                          )
                            return;
                          run(() => revokeAccessAction(user.id, id));
                        }}
                      >
                        Thu hồi {id}
                      </Button>
                    ))}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Modal
        opened={granting !== null}
        onClose={() => setGranting(null)}
        title={`Cấp gói cho ${granting?.email ?? ''}`}
      >
        <Select
          label="Gói"
          data={packages.map((p) => ({ value: p.id, label: p.name }))}
          value={packageId}
          onChange={(v) => v && setPackageId(v)}
          allowDeselect={false}
          mb="sm"
        />
        <TextInput
          label="Lý do"
          description="Ghi lại vì sao cấp tay — sau này còn đối chiếu được."
          placeholder="CK thiếu mã, đã đối chiếu sao kê 25/08"
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setGranting(null)}>
            Huỷ
          </Button>
          <Button
            loading={pending}
            onClick={() => {
              if (!granting) return;
              run(() => grantAccessAction(granting.id, packageId, note));
            }}
          >
            Cấp quyền
          </Button>
        </Group>
      </Modal>
    </>
  );
}
