import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Table, Badge, Button, Flex, Text, Dialog, TextField } from '@radix-ui/themes';
import { Check } from '@healthchecks/shared';
import { formatDistanceToNow } from 'date-fns';
import { Plus, RefreshCw, LogOut, Settings as SettingsIcon, Shield, Edit2 } from 'lucide-react';
import { TextArea } from '@radix-ui/themes';
import { User } from '@healthchecks/shared';
import { ApiClient } from '../api/ApiClient.js';

export default function Dashboard() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadChecks = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getChecks();
      setChecks(data);
    } catch (err) {
      if ((err as Error).message === 'Unauthorized' || (err as Error).message.includes('401')) {
        navigate('/login');
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const u = await ApiClient.getMe();
      setUser(u);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiClient.logout();
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
          {user && (
            <Text size="2" color="gray" mr="2">
              Welcome, <a href={`/u/${user.username}`} style={{ textDecoration: 'none', color: 'inherit' }}><strong>{user.username}</strong></a>
            </Text>
          )}
          {user?.role === 'ADMIN' && (
            <Button variant="soft" color="indigo" onClick={() => navigate('/admin')}>
              <Shield size={16} /> Admin
            </Button>
          )}
          <Button variant="soft" color="gray" onClick={() => navigate('/settings')}>
            <SettingsIcon size={16} /> Settings
          </Button>
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
              <Table.RowHeaderCell>
                <Flex direction="column">
                  <Text>{check.name}</Text>
                  {check.description && (
                    <Text size="1" color="gray" mt="1">{check.description}</Text>
                  )}
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell>
                <Badge color={getStatusColor(check.status)}>{check.status}</Badge>
              </Table.Cell>
              <Table.Cell>
                {check.lastPing ? formatDistanceToNow(new Date(check.lastPing), { addSuffix: true }) : 'Never'}
              </Table.Cell>
              <Table.Cell>{(check.intervalSeconds / 60).toFixed(0)} min</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button variant="outline" size="1" onClick={() => navigate(`/checks/${check.id}`)}>
                    Details
                  </Button>
                  <EditCheckDialog check={check} onUpdated={loadChecks}>
                    <Button variant="soft" color="gray" size="1">
                      <Edit2 size={14} /> Edit
                    </Button>
                  </EditCheckDialog>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}

export function EditCheckDialog({ check, onUpdated, children }: { check: Check, onUpdated: () => void, children: React.ReactNode }) {
  const [name, setName] = useState<string>(check.name);
  const [description, setDescription] = useState<string>(check.description || '');
  const [intervalMin, setIntervalMin] = useState<number>(Math.floor(check.intervalSeconds / 60));
  const [graceMin, setGraceMin] = useState<number>(Math.floor(check.graceSeconds / 60));
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await ApiClient.updateCheck(check.id, {
        name,
        description: description.trim() || null,
        intervalSeconds: intervalMin * 60,
        graceSeconds: graceMin * 60
      });
      onUpdated();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to update check');
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        {children}
      </Dialog.Trigger>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Edit Check</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Update the settings for this check.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Name</Text>
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Database Backup" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Description (optional)</Text>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this check" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Interval (minutes)</Text>
            <TextField.Root type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Grace Period (minutes)</Text>
            <TextField.Root type="number" min="1" value={graceMin} onChange={(e) => setGraceMin(parseInt(e.target.value) || 1)} />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end" align="center">
          {error && <Text color="red" size="2" mr="auto">{error}</Text>}
          <Dialog.Close>
            <Button variant="soft" color="gray">Cancel</Button>
          </Dialog.Close>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function CreateCheckDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [intervalMin, setIntervalMin] = useState<number>(60);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await ApiClient.createCheck({
        name,
        description: description.trim() || null,
        intervalSeconds: intervalMin * 60,
        graceSeconds: Math.floor(intervalMin * 60 * 0.2) // 20% grace period by default
      });
      setName('');
      setDescription('');
      onCreated();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to create check');
    }
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
            <Text as="div" size="2" mb="1" weight="bold">Description (optional)</Text>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this check" />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">Interval (minutes)</Text>
            <TextField.Root type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end" align="center">
          {error && <Text color="red" size="2" mr="auto">{error}</Text>}
          <Dialog.Close>
            <Button variant="soft" color="gray">Cancel</Button>
          </Dialog.Close>
          <Button onClick={handleSubmit}>Create</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
