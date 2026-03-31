import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Table, Badge, Button, Flex, Text, Dialog, TextField, Select, Callout } from '@radix-ui/themes';
import { Plus, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '@healthchecks/shared';
import { ApiClient } from '../api/ApiClient.js';

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getUsers();
      setUsers(data);
    } catch (err) {
      if ((err as Error).message.includes('Forbidden') || (err as Error).message.includes('403')) {
        setError('Access Denied: Admins Only');
      } else {
        setError('Network Error or Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      await ApiClient.updateUserRole(userId, { role: newRole });
      loadUsers();
    } catch (err) {
      setError((err as Error).message || 'Error updating role');
    }
  };

  if (error) {
    return (
      <Container size="4" py="6">
        <Flex direction="column" align="center" gap="4">
          <Callout.Root color="ruby" variant="surface">
            <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
          <Button variant="soft" color="gray" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Back to Dashboard</Button>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size="4" py="6">
      <Flex mb="6" align="center" gap="3">
        <Button variant="ghost" color="gray" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><ArrowLeft size={16} /> Back</Button>
      </Flex>

      <Flex justify="between" align="center" mb="8">
        <Heading size="8" style={{ color: 'var(--slate-12)' }}>User Management</Heading>
        <Flex gap="3" align="center">
          <Button variant="soft" color="iris" onClick={loadUsers} disabled={loading} style={{ cursor: 'pointer' }}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <CreateUserDialog onCreated={loadUsers} />
        </Flex>
      </Flex>

      <Table.Root variant="surface" size="3">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Display Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Joined</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map(u => (
            <Table.Row key={u.id} align="center">
              <Table.RowHeaderCell>
                <a href={`/u/${u.username}`} style={{ textDecoration: 'none', color: 'var(--accent-9)', fontWeight: 500 }}>
                  {u.username}
                </a>
              </Table.RowHeaderCell>
              <Table.Cell><Text color="gray">{u.displayName || '-'}</Text></Table.Cell>
              <Table.Cell>
                <Badge color={u.role === 'ADMIN' ? 'ruby' : 'iris'} radius="full" size="2">{u.role}</Badge>
              </Table.Cell>
              <Table.Cell><Text color="gray">{format(new Date(u.createdAt), 'MMM d, yyyy')}</Text></Table.Cell>
              <Table.Cell>
                <Select.Root size="2" value={u.role} onValueChange={(val: 'USER'|'ADMIN') => handleRoleChange(u.id, val)}>
                  <Select.Trigger variant="soft" />
                  <Select.Content>
                    <Select.Item value="USER">User</Select.Item>
                    <Select.Item value="ADMIN">Admin</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    setError('');
    try {
      await ApiClient.createUser({ username, password, role });
      setUsername('');
      setPassword('');
      setRole('USER');
      onCreated();
    } catch (err) {
      setError((err as Error).message || 'Error creating user');
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant="solid" style={{ cursor: 'pointer' }}><Plus size={16} /> Add User</Button>
      </Dialog.Trigger>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Create New User</Dialog.Title>
        <Dialog.Description size="2" mb="5">
          Add a new user directly to the platform.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <label>
            <Text as="div" size="2" mb="2" weight="medium">Username</Text>
            <TextField.Root size="3" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label>
            <Text as="div" size="2" mb="2" weight="medium">Password</Text>
            <TextField.Root size="3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <label>
            <Text as="div" size="2" mb="2" weight="medium">Role</Text>
            <Select.Root size="3" value={role} onValueChange={(val: 'USER'|'ADMIN') => setRole(val)}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="USER">User</Select.Item>
                <Select.Item value="ADMIN">Admin</Select.Item>
              </Select.Content>
            </Select.Root>
          </label>
        </Flex>

        <Flex gap="3" mt="5" justify="end" align="center">
          {error && <Text color="ruby" size="2" mr="auto">{error}</Text>}
          <Dialog.Close>
            <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>Cancel</Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} variant="solid" style={{ cursor: 'pointer' }}>Create</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
