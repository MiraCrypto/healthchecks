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
  const [quickAddVal, setQuickAddVal] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
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
          <Button variant="outline" color="red" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </Flex>
      </Flex>

      <Flex mb="6" direction="column" gap="2">
        <TextField.Root
          size="3"
          placeholder="Quick Add: Type a check name and press Enter..."
          value={quickAddVal}
          onChange={(e) => setQuickAddVal(e.target.value)}
          disabled={quickAddLoading}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && quickAddVal.trim()) {
              setQuickAddLoading(true);
              try {
                await ApiClient.createCheck({ name: quickAddVal.trim() });
                setQuickAddVal('');
                await loadChecks();
              } catch (err) {
                console.error(err);
                alert('Failed to create check: ' + ((err as Error).message || 'Unknown error'));
              } finally {
                setQuickAddLoading(false);
              }
            }
          }}
        />
      </Flex>

      {checks.length === 0 && (
        <Table.Root variant="surface">
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={5} style={{ textAlign: 'center' }}>
                <Text color="gray">No checks found. Create your first check above!</Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      )}

      {Object.entries(
        checks.reduce((acc, check) => {
          const g = check.group || 'Default';
          if (!acc[g]) acc[g] = [];
          acc[g].push(check);
          return acc;
        }, {} as Record<string, Check[]>)
      ).sort(([g1], [g2]) => {
        if (g1 === 'Default') return 1;
        if (g2 === 'Default') return -1;
        return g1.localeCompare(g2);
      }).map(([groupName, groupChecks]) => (
        <Flex key={groupName} direction="column" mb="6" gap="3">
          <Heading size="4">{groupName}</Heading>
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
              {groupChecks.map(check => (
                <Table.Row key={check.id} align="center">
                  <Table.RowHeaderCell>
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text>{check.name}</Text>
                        {check.tags && check.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                          <Badge key={tag} size="1" color="gray">{tag}</Badge>
                        ))}
                      </Flex>
                      {check.description && (
                        <Text size="1" color="gray">{check.description}</Text>
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
                        Details / Edit
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Flex>
      ))}

    </Container>
  );
}
