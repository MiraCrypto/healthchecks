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

  if (loading) return <Text color="gray" size="2">Loading payload...</Text>;
  if (error) return <Text color="ruby" size="2">{error}</Text>;

  const isText = contentType.includes('text/') || contentType.includes('application/json');

  return (
    <Box mt="3" mb="4">
      {isText ? (
        <ScrollArea type="always" scrollbars="both" style={{ maxHeight: 300 }}>
          <Box style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--gray-5)', padding: 'var(--space-4)', borderRadius: 'var(--radius-3)', color: 'var(--slate-12)' }}>
            {content || <Text color="gray" style={{ fontStyle: 'italic' }}>Empty payload</Text>}
          </Box>
        </ScrollArea>
      ) : (
        <Text color="gray" size="2" style={{ fontStyle: 'italic' }}>
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
  const [actionLoading, setActionLoading] = useState(false);

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
      case 'DOWN': return 'ruby';
      case 'PAUSED': return 'amber';
      default: return 'gray';
    }
  };

  const pingUrl = `${window.location.origin}/ping/${check.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pingUrl);
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await ApiClient.updateCheck(check.id, { status: 'UP' });
      loadData();
    } catch (err) {
      setError((err as Error).message || 'Error resuming check');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await ApiClient.updateCheck(check.id, { status: 'PAUSED' });
      loadData();
    } catch (err) {
      setError((err as Error).message || 'Error pausing check');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container size="4" py="6">
      <Flex mb="8" justify="between" align="center">
        <Flex gap="4" align="center">
          <Button variant="ghost" onClick={() => navigate('/')} color="gray" style={{ cursor: 'pointer' }}><ArrowLeft size={16} /> Back</Button>
          <Heading size="7">{check.name}</Heading>
          <Badge color={getStatusColor(check.status)} radius="full" size="2">{check.status}</Badge>
        </Flex>
        <Flex gap="3">
          {check.status === 'PAUSED' ? (
            <Button variant="soft" color="green" onClick={handleResume} disabled={actionLoading} style={{ cursor: 'pointer' }}>Resume</Button>
          ) : (
            <Button variant="soft" color="amber" onClick={handlePause} disabled={actionLoading} style={{ cursor: 'pointer' }}>Pause</Button>
          )}
          <Dialog.Root>
            <Dialog.Trigger>
              <Button variant="soft" color="ruby" style={{ cursor: 'pointer' }}><Trash2 size={16} /> Delete</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>Delete Check</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Are you sure you want to delete this check? This action cannot be undone.
              </Dialog.Description>
              <Flex gap="3" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>Cancel</Button>
                </Dialog.Close>
                <Dialog.Close>
                  <Button variant="solid" color="ruby" onClick={handleDelete} disabled={actionLoading} style={{ cursor: 'pointer' }}>Delete</Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Flex>

      <Grid columns={{ initial: '1', md: '2' }} gap="6">
        <Box>
          <Card size="3" variant="surface" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Flex justify="between" align="center" mb="3">
              <Heading size="4" style={{ color: 'var(--slate-12)' }}>Runbook</Heading>
              <Button onClick={handleSaveRunbook} disabled={runbookSaving} size="1" variant="soft" color="iris" style={{ cursor: 'pointer' }}>
                <Save size={14} /> Save Runbook
              </Button>
            </Flex>
            <Text size="2" color="gray" mb="4">
              Write your incident response runbook, architecture notes, or emergency contacts here.
            </Text>

            {runbookMessage && (
              <Box mb="4">
                <Callout.Root color={runbookMessage.type === 'error' ? 'ruby' : 'green'} variant="surface">
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
              size="3"
              value={runbook}
              onChange={(e) => setRunbook(e.target.value)}
              placeholder="# Incident Response Plan..."
              style={{ flex: 1, minHeight: '400px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}
            />
          </Card>
        </Box>

        <Flex direction="column" gap="4">
          <Card size="3" variant="surface">
            <Heading size="4" mb="4" style={{ color: 'var(--slate-12)' }}>Integration</Heading>
            <Flex gap="2" align="center" style={{ backgroundColor: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--radius-3)', border: '1px solid var(--gray-5)', marginBottom: '16px' }}>
              <Box style={{ flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <Text size="2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate-11)' }}>{pingUrl}</Text>
              </Box>
              <Button variant="ghost" color="gray" onClick={handleCopyUrl} style={{ cursor: 'pointer' }}><Copy size={16} /></Button>
            </Flex>

            <Flex align="center" justify="between" mb="4">
              <Heading size="4" style={{ color: 'var(--slate-12)' }}>Settings</Heading>
              <Box>
                <Text as="div" size="1" color="gray" align="right">Created At</Text>
                <Text size="2">{format(new Date(check.createdAt), 'MMM d, yyyy')}</Text>
              </Box>
            </Flex>
            <Flex direction="column" gap="4" mb="5">
              <label>
                <Text as="div" size="2" mb="2" weight="medium">Name</Text>
                <TextField.Root size="3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Check Name" />
              </label>

              <label>
                <Text as="div" size="2" mb="2" weight="medium">Description</Text>
                <TextArea size="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context about this check" />
              </label>

              <Grid columns="2" gap="4">
                <label>
                  <Text as="div" size="2" mb="2" weight="medium">Group</Text>
                  <TextField.Root size="3" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Production" />
                </label>
                <label>
                  <Text as="div" size="2" mb="2" weight="medium">Tags (comma separated)</Text>
                  <TextField.Root size="3" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="web, db" />
                </label>
              </Grid>

              <Grid columns="2" gap="4">
                <label>
                  <Text as="div" size="2" mb="2" weight="medium">Interval (minutes)</Text>
                  <TextField.Root size="3" type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
                </label>
                <label>
                  <Text as="div" size="2" mb="2" weight="medium">Grace Period (minutes)</Text>
                  <TextField.Root size="3" type="number" min="1" value={graceMin} onChange={(e) => setGraceMin(parseInt(e.target.value) || 1)} />
                </label>
              </Grid>
            </Flex>

            {settingsMessage && (
              <Box mb="5">
                <Callout.Root color={settingsMessage.type === 'error' ? 'ruby' : 'green'} variant="surface">
                  <Callout.Icon>
                    {settingsMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  </Callout.Icon>
                  <Callout.Text>
                    {settingsMessage.text}
                  </Callout.Text>
                </Callout.Root>
              </Box>
            )}

            <Button onClick={handleSaveSettings} disabled={settingsSaving} variant="solid" size="3" style={{ cursor: 'pointer' }}>
              <Save size={16} /> Save Settings
            </Button>
          </Card>

          <Card size="3" variant="surface" style={{ height: '100%' }}>
            <Heading size="4" mb="4" style={{ color: 'var(--slate-12)' }}>Recent Pings</Heading>
            <Table.Root variant="surface" size="2">
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
                    <Table.Cell colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text color="gray">No pings received yet.</Text>
                    </Table.Cell>
                  </Table.Row>
                )}
                {pings.map(ping => (
                  <Table.Row key={ping.id}>
                    <Table.Cell><Text size="2">{format(new Date(ping.createdAt), 'PPpp')}</Text></Table.Cell>
                    <Table.Cell><Text size="2" color="gray">{formatDistanceToNow(new Date(ping.createdAt), { addSuffix: true })}</Text></Table.Cell>
                    <Table.Cell>
                      {ping.hasPayload ? (
                        <Button variant="soft" color="gray" size="1" onClick={() => setSelectedPingForPayload(ping)} style={{ cursor: 'pointer' }}>
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

          <Flex gap="3" mt="5" justify="end">
            {selectedPingForPayload && (
              <>
                <Button
                  variant="soft"
                  color="iris"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/payload/${selectedPingForPayload.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Copy size={16} /> Copy Permlink
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => window.open(`/payload/${selectedPingForPayload.id}`, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
                  <ExternalLink size={16} /> Open in New Tab
                </Button>
              </>
            )}
            <Dialog.Close>
              <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>Close</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
