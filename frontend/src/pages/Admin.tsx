import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Table, Badge, Button, Flex, Text, Dialog, TextField, Select, Callout } from '@radix-ui/themes';
import { Plus, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  displayName: string | null;
  createdAt: string;
}

export default function Admin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access Denied: Admins Only');
        } else {
          setError('Failed to load users');
        }
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError('Network Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        loadUsers();
      } else {
        alert('Failed to update role');
      }
    } catch (err) {
      alert('Error updating role');
    }
  };

  if (error) {
    return (
      <Container size="4" py="6">
        <Flex direction="column" align="center" gap="4">
          <Callout.Root color="red">
            <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size="4" py="6">
      <Flex mb="6" align="center" gap="3">
        <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={16} /> Dashboard</Button>
      </Flex>

      <Flex justify="between" align="center" mb="6">
        <Heading size="8">User Management</Heading>
        <Flex gap="3" align="center">
          <Button variant="soft" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <CreateUserDialog onCreated={loadUsers} />
        </Flex>
      </Flex>

      <Table.Root variant="surface">
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
                <a href={`/u/${u.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <strong>{u.username}</strong>
                </a>
              </Table.RowHeaderCell>
              <Table.Cell>{u.displayName || '-'}</Table.Cell>
              <Table.Cell>
                <Badge color={u.role === 'ADMIN' ? 'ruby' : 'blue'}>{u.role}</Badge>
              </Table.Cell>
              <Table.Cell>{format(new Date(u.createdAt), 'MMM d, yyyy')}</Table.Cell>
              <Table.Cell>
                <Select.Root value={u.role} onValueChange={(val: 'USER'|'ADMIN') => handleRoleChange(u.id, val)}>
                  <Select.Trigger />
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      if (res.ok) {
        setUsername('');
        setPassword('');
        setRole('USER');
        onCreated();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error creating user');
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button><Plus size={16} /> Add User</Button>
      </Dialog.Trigger>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Create New User</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Add a new user directly to the platform.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Username</Text>
            <TextField.Root value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Password</Text>
            <TextField.Root type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Role</Text>
            <Select.Root value={role} onValueChange={(val: 'USER'|'ADMIN') => setRole(val)}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="USER">User</Select.Item>
                <Select.Item value="ADMIN">Admin</Select.Item>
              </Select.Content>
            </Select.Root>
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">Cancel</Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button onClick={handleSubmit}>Create</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
