import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Table, Badge, Button, Flex, Text, Dialog, TextField } from '@radix-ui/themes';
import { Check } from '@healthchecks/shared';
import { formatDistanceToNow } from 'date-fns';
import { Plus, RefreshCw, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [user, setUser] = useState<{ id: string, username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadChecks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checks');
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load checks');
      const data = await res.json();
      setChecks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        setUser(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUser();
    loadChecks();
    const timer = setInterval(loadChecks, 30000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'green';
      case 'DOWN': return 'red';
      case 'PAUSED': return 'amber';
      default: return 'gray';
    }
  };

  return (
    <Container size="4" py="6">
      <Flex justify="between" align="center" mb="6">
        <Heading size="8">Checks</Heading>
        <Flex gap="3" align="center">
          {user && <Text size="2" color="gray" mr="2">Welcome, <strong>{user.username}</strong></Text>}
          <Button variant="soft" onClick={loadChecks} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <CreateCheckDialog onCreated={loadChecks} />
          <Button variant="outline" color="red" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </Flex>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Last Ping</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Interval</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {checks.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} style={{ textAlign: 'center' }}>
                <Text color="gray">No checks found. Create your first check!</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {checks.map(check => (
            <Table.Row key={check.id} align="center">
              <Table.RowHeaderCell>{check.name}</Table.RowHeaderCell>
              <Table.Cell>
                <Badge color={getStatusColor(check.status)}>{check.status}</Badge>
              </Table.Cell>
              <Table.Cell>
                {check.lastPing ? formatDistanceToNow(new Date(check.lastPing), { addSuffix: true }) : 'Never'}
              </Table.Cell>
              <Table.Cell>{(check.intervalSeconds / 60).toFixed(0)} min</Table.Cell>
              <Table.Cell>
                <Button variant="outline" size="1" onClick={() => navigate(`/checks/${check.id}`)}>
                  Details
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}

function CreateCheckDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [intervalMin, setIntervalMin] = useState(60);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        intervalSeconds: intervalMin * 60,
        graceSeconds: Math.floor(intervalMin * 60 * 0.2) // 20% grace period by default
      })
    });
    setName('');
    onCreated();
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button><Plus size={16} /> New Check</Button>
      </Dialog.Trigger>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Create New Check</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Add a new ping endpoint to monitor your service.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Name</Text>
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Database Backup" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Interval (minutes)</Text>
            <TextField.Root type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
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
