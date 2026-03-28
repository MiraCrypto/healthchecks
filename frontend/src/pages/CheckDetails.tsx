import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Card, Text, Badge, Button, Flex, Table, Box, Dialog, ScrollArea, Code } from '@radix-ui/themes';
import { Check, Ping } from '@healthchecks/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trash2, FileText, Copy, ExternalLink, Edit2 } from 'lucide-react';
import { EditCheckDialog } from './Dashboard';

function PayloadViewer({ pingId }: { pingId: string }) {
  const [content, setContent] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchPayload = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/ping/payload/${pingId}`);
        if (!res.ok) {
          throw new Error('Failed to load payload');
        }
        const ct = res.headers.get('content-type') || '';
        setContentType(ct);

        if (ct.includes('text/') || ct.includes('application/json')) {
          const text = await res.text();
          if (isMounted) setContent(text);
        } else {
          // It's binary or something else we don't want to render as raw text
          if (isMounted) setContent('Binary or unsupported payload format.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading payload');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPayload();
    return () => { isMounted = false; };
  }, [pingId]);

  if (loading) return <Text color="gray">Loading payload...</Text>;
  if (error) return <Text color="red">{error}</Text>;

  const isText = contentType.includes('text/') || contentType.includes('application/json');

  return (
    <Box mt="2" mb="4">
      {isText ? (
        <ScrollArea type="always" scrollbars="both" style={{ maxHeight: 300 }}>
          <Box style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 'var(--font-size-2)', backgroundColor: 'var(--gray-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-2)' }}>
            {content}
          </Box>
        </ScrollArea>
      ) : (
        <Text color="gray" style={{ fontStyle: 'italic' }}>
          {content}
        </Text>
      )}
    </Box>
  );
}

export default function CheckDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [check, setCheck] = useState<Check | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPingForPayload, setSelectedPingForPayload] = useState<Ping | null>(null);

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
          <Box>
            <Heading size="7">{check.name}</Heading>
            {check.description && (
              <Text as="p" size="3" color="gray" mt="2">{check.description}</Text>
            )}
          </Box>
          <Flex gap="3" align="center">
            <Badge size="2" color={getStatusColor(check.status)}>{check.status}</Badge>
            <EditCheckDialog check={check} onUpdated={loadData}>
              <Button variant="soft" color="gray">
                <Edit2 size={16} /> Edit
              </Button>
            </EditCheckDialog>
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
            <Table.ColumnHeaderCell>Payload</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {pings.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} style={{ textAlign: 'center' }}>
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
              <Table.Cell>
                {ping.hasPayload ? (
                  <Button variant="soft" size="1" onClick={() => setSelectedPingForPayload(ping)}>
                    <FileText size={14} /> View Payload
                  </Button>
                ) : (
                  <Text color="gray" size="2">-</Text>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Dialog.Root open={!!selectedPingForPayload} onOpenChange={(open) => !open && setSelectedPingForPayload(null)}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>Ping Payload</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Payload details for ping at {selectedPingForPayload && format(new Date(selectedPingForPayload.createdAt), 'PPpp')}
          </Dialog.Description>

          {selectedPingForPayload && <PayloadViewer pingId={selectedPingForPayload.id} />}

          <Flex gap="3" mt="4" justify="end">
            {selectedPingForPayload && (
              <>
                <Button
                  variant="soft"
                  color="blue"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/ping/payload/${selectedPingForPayload.id}`)}
                >
                  <Copy size={16} /> Copy Permlink
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => window.open(`/ping/payload/${selectedPingForPayload.id}`, '_blank')}
                >
                  <ExternalLink size={16} /> Open in New Tab
                </Button>
              </>
            )}
            <Dialog.Close>
              <Button variant="soft" color="gray">Close</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
