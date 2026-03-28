import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Card, Text, Badge, Button, Flex, Table, Box } from '@radix-ui/themes';
import { Check, Ping } from '@healthchecks/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function CheckDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [check, setCheck] = useState<Check | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [checkRes, pingsRes] = await Promise.all([
        fetch(`/api/checks/${id}`),
        fetch(`/api/checks/${id}/pings`)
      ]);

      if (checkRes.status === 401 || pingsRes.status === 401) {
        navigate('/login');
        return;
      }
      if (checkRes.status === 404) {
        navigate('/');
        return;
      }

      if (!checkRes.ok || !pingsRes.ok) throw new Error('Failed to load data');

      setCheck(await checkRes.json());
      setPings(await pingsRes.json());
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this check? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/checks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete check');
      navigate('/');
    } catch (err) {
      alert('Failed to delete check');
    }
  };

  if (loading || !check) return <Container py="6"><Text>Loading...</Text></Container>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'green';
      case 'DOWN': return 'red';
      case 'PAUSED': return 'amber';
      default: return 'gray';
    }
  };

  const pingUrl = `${window.location.origin}/ping/${check.id}`;

  return (
    <Container size="3" py="6">
      <Flex align="center" gap="3" mb="6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
      </Flex>

      <Card size="4" mb="6">
        <Flex justify="between" align="center" mb="4">
          <Heading size="7">{check.name}</Heading>
          <Flex gap="3" align="center">
            <Badge size="2" color={getStatusColor(check.status)}>{check.status}</Badge>
            <Button color="red" variant="soft" onClick={handleDelete}>
              <Trash2 size={16} /> Delete
            </Button>
          </Flex>
        </Flex>

        <Box mb="4">
          <Text as="div" size="2" color="gray" mb="1">Ping URL:</Text>
          <Card variant="surface" style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
            {pingUrl}
          </Card>
        </Box>

        <Flex gap="6">
          <Box>
            <Text as="div" size="2" color="gray" mb="1">Interval</Text>
            <Text size="3" weight="bold">{(check.intervalSeconds / 60).toFixed(0)} min</Text>
          </Box>
          <Box>
            <Text as="div" size="2" color="gray" mb="1">Grace Period</Text>
            <Text size="3" weight="bold">{(check.graceSeconds / 60).toFixed(0)} min</Text>
          </Box>
          <Box>
            <Text as="div" size="2" color="gray" mb="1">Created At</Text>
            <Text size="3" weight="bold">{format(new Date(check.createdAt), 'MMM d, yyyy')}</Text>
          </Box>
        </Flex>
      </Card>

      <Heading size="5" mb="4">Recent Pings</Heading>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Relative</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Remote IP</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Method</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {pings.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>
                <Text color="gray">No pings received yet.</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {pings.map(ping => (
            <Table.Row key={ping.id}>
              <Table.Cell>{format(new Date(ping.createdAt), 'PPpp')}</Table.Cell>
              <Table.Cell>{formatDistanceToNow(new Date(ping.createdAt), { addSuffix: true })}</Table.Cell>
              <Table.Cell>{ping.remoteIp || 'Unknown'}</Table.Cell>
              <Table.Cell><Badge color="blue">{ping.method || 'GET'}</Badge></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}
