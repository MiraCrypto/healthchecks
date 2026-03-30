import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Card, Text, Badge, Button, Flex, Table, Box, Dialog, ScrollArea, Grid, TextArea, TextField, Callout } from '@radix-ui/themes';
import { Check, Ping } from '@healthchecks/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trash2, FileText, Copy, ExternalLink, Edit2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';

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
        const { text, contentType: ct } = await ApiClient.getPayloadText(pingId);
        setContentType(ct);

        if (ct.includes('text/') || ct.includes('application/json')) {
          if (isMounted) setContent(text);
        } else {
          // It's binary or something else we don't want to render as raw text
          if (isMounted) setContent('Binary or unsupported payload format.');
        }
      } catch (err) {
        if (isMounted) setError((err as Error).message || 'Error loading payload');
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
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPingForPayload, setSelectedPingForPayload] = useState<Ping | null>(null);
  const [error, setError] = useState<string>('');

  // Editable settings state
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [intervalMin, setIntervalMin] = useState(60);
  const [graceMin, setGraceMin] = useState(15);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Runbook state
  const [runbook, setRunbook] = useState('');
  const [runbookSaving, setRunbookSaving] = useState(false);
  const [runbookMessage, setRunbookMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const [checkData, pingsData] = await Promise.all([
        ApiClient.getCheck(id),
        ApiClient.getCheckPings(id)
      ]);

      setCheck(checkData);
      setName(checkData.name);
      setGroup(checkData.group || '');
      setDescription(checkData.description || '');
      setTags(checkData.tags || '');
      setIntervalMin(Math.floor(checkData.intervalSeconds / 60));
      setGraceMin(Math.floor(checkData.graceSeconds / 60));
      setRunbook(checkData.runbook || '');

      setPings(pingsData);
    } catch (err) {
      if ((err as Error).message === 'Unauthorized' || (err as Error).message.includes('401')) {
        navigate('/login');
      } else if ((err as Error).message.includes('404')) {
        navigate('/');
      } else {
        console.error(err);
      }
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
    if (!id || !window.confirm('Are you sure you want to delete this check? This cannot be undone.')) return;
    setError('');
    try {
      await ApiClient.deleteCheck(id);
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete check');
    }
  };

  const handleSaveSettings = async () => {
    if (!id || !check) return;
    if (!name.trim()) {
      setSettingsMessage({ type: 'error', text: 'Name is required' });
      return;
    }
    setSettingsMessage(null);
    setSettingsSaving(true);
    try {
      await ApiClient.updateCheck(id, {
        name: name.trim(),
        group: group.trim() === '' ? null : group.trim(),
        description: description.trim() === '' ? null : description.trim(),
        tags: tags.trim() === '' ? null : tags.trim(),
        intervalSeconds: intervalMin * 60,
        graceSeconds: graceMin * 60
      });
      await loadData();
      setSettingsMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Failed to save settings: ' + ((err as Error).message || 'Unknown error') });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveRunbook = async () => {
    if (!id || !check) return;
    setRunbookMessage(null);
    setRunbookSaving(true);
    try {
      await ApiClient.updateCheck(id, {
        runbook: runbook.trim() === '' ? null : runbook.trim()
      });
      await loadData();
      setRunbookMessage({ type: 'success', text: 'Runbook saved successfully' });
    } catch (err) {
      console.error(err);
      setRunbookMessage({ type: 'error', text: 'Failed to save runbook: ' + ((err as Error).message || 'Unknown error') });
    } finally {
      setRunbookSaving(false);
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
    <Container size="4" py="6">
      <Flex align="center" justify="between" mb="6">
        <Flex align="center" gap="3">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
          <Heading size="7">{check.name}</Heading>
          <Badge size="2" color={getStatusColor(check.status)}>{check.status}</Badge>
        </Flex>
        <Flex align="center" gap="3">
          {error && <Text color="red" size="2">{error}</Text>}
          <Button color="red" variant="soft" onClick={handleDelete}>
            <Trash2 size={16} /> Delete Check
          </Button>
        </Flex>
      </Flex>

      <Grid columns="2" gap="6">
        <Box>
          <Card size="3" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Flex justify="between" align="center" mb="3">
              <Heading size="4">Runbook</Heading>
              <Button onClick={handleSaveRunbook} disabled={runbookSaving} size="1" variant="soft">
                <Save size={14} /> Save Runbook
              </Button>
            </Flex>
            <Text size="2" color="gray" mb="4">
              Write your incident response runbook, architecture notes, or emergency contacts here.
            </Text>

            {runbookMessage && (
              <Box mb="4">
                <Callout.Root color={runbookMessage.type === 'error' ? 'red' : 'green'}>
                  <Callout.Icon>
                    {runbookMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  </Callout.Icon>
                  <Callout.Text>
                    {runbookMessage.text}
                  </Callout.Text>
                </Callout.Root>
              </Box>
            )}

            <TextArea
              value={runbook}
              onChange={(e) => setRunbook(e.target.value)}
              placeholder="# Incident Response Plan..."
              style={{ flex: 1, minHeight: '400px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
            />
          </Card>
        </Box>

        <Flex direction="column" gap="4">
          <Card size="3">
            <Heading size="4" mb="3">Ping URL</Heading>
            <Card variant="surface" style={{ padding: '8px 12px', fontFamily: 'monospace', marginBottom: '16px' }}>
              {pingUrl}
            </Card>

            <Flex align="center" justify="between" mb="3">
              <Heading size="4">Settings</Heading>
              <Box>
                <Text as="div" size="1" color="gray" align="right">Created At</Text>
                <Text size="2">{format(new Date(check.createdAt), 'MMM d, yyyy')}</Text>
              </Box>
            </Flex>
            <Flex direction="column" gap="4" mb="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Name</Text>
                <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder="Check Name" />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Description</Text>
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context about this check" />
              </label>

              <Grid columns="2" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Group</Text>
                  <TextField.Root value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Production" />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Tags (comma separated)</Text>
                  <TextField.Root value={tags} onChange={(e) => setTags(e.target.value)} placeholder="web, db, critical" />
                </label>
              </Grid>

              <Grid columns="2" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Interval (minutes)</Text>
                  <TextField.Root type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Grace Period (minutes)</Text>
                  <TextField.Root type="number" min="1" value={graceMin} onChange={(e) => setGraceMin(parseInt(e.target.value) || 1)} />
                </label>
              </Grid>
            </Flex>

            {settingsMessage && (
              <Box mb="4">
                <Callout.Root color={settingsMessage.type === 'error' ? 'red' : 'green'}>
                  <Callout.Icon>
                    {settingsMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  </Callout.Icon>
                  <Callout.Text>
                    {settingsMessage.text}
                  </Callout.Text>
                </Callout.Root>
              </Box>
            )}

            <Button onClick={handleSaveSettings} disabled={settingsSaving} variant="soft">
              <Save size={16} /> Save Settings
            </Button>
          </Card>

          <Card size="3">
            <Heading size="4" mb="3">Recent Pings</Heading>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Relative</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Payload</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pings.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={3} style={{ textAlign: 'center' }}>
                      <Text color="gray">No pings received yet.</Text>
                    </Table.Cell>
                  </Table.Row>
                )}
                {pings.map(ping => (
                  <Table.Row key={ping.id}>
                    <Table.Cell>{format(new Date(ping.createdAt), 'PPpp')}</Table.Cell>
                    <Table.Cell>{formatDistanceToNow(new Date(ping.createdAt), { addSuffix: true })}</Table.Cell>
                    <Table.Cell>
                      {ping.hasPayload ? (
                        <Button variant="soft" size="1" onClick={() => setSelectedPingForPayload(ping)}>
                          <FileText size={14} /> View
                        </Button>
                      ) : (
                        <Text color="gray" size="2">-</Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        </Flex>
      </Grid>

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
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/payload/${selectedPingForPayload.id}`)}
                >
                  <Copy size={16} /> Copy Permlink
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => window.open(`/payload/${selectedPingForPayload.id}`, '_blank')}
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
