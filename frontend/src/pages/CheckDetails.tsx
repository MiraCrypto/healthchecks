import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Ping } from '@healthchecks/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trash2, FileText, Copy, ExternalLink, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';

import { Button } from "@/components/ui/button.js";
import { Badge } from "@/components/ui/badge.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { ScrollArea } from "@/components/ui/scroll-area.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";

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

  if (loading) return <span className="text-muted-foreground">Loading payload...</span>;
  if (error) return <span className="text-destructive">{error}</span>;

  const isText = contentType.includes('text/') || contentType.includes('application/json');

  return (
    <div className="mt-2 mb-4">
      {isText ? (
        <ScrollArea className="h-[300px] w-full rounded-md border bg-muted p-4 font-mono text-sm whitespace-pre-wrap break-all">
          {content}
        </ScrollArea>
      ) : (
        <span className="text-muted-foreground italic">
          {content}
        </span>
      )}
    </div>
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

  if (loading || !check) return <div className="container mx-auto py-6"><span>Loading...</span></div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'default'; // primary
      case 'DOWN': return 'destructive';
      case 'PAUSED': return 'secondary';
      default: return 'outline';
    }
  };

  const pingUrl = `${window.location.origin}/ping/${check.id}`;

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{check.name}</h1>
          <Badge variant={getStatusColor(check.status)}>{check.status}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-destructive">{error}</span>}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Runbook</CardTitle>
              <Button onClick={handleSaveRunbook} disabled={runbookSaving} size="sm" variant="secondary">
                <Save className="w-4 h-4 mr-2" /> Save Runbook
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <span className="text-sm text-muted-foreground">
                Write your incident response runbook, architecture notes, or emergency contacts here.
              </span>

              {runbookMessage && (
                <Alert variant={runbookMessage.type === 'error' ? 'destructive' : 'default'}>
                  {runbookMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertTitle>{runbookMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                  <AlertDescription>{runbookMessage.text}</AlertDescription>
                </Alert>
              )}

              <Textarea
                value={runbook}
                onChange={(e) => setRunbook(e.target.value)}
                placeholder="# Incident Response Plan..."
                className="flex-1 min-h-[400px] font-mono resize-y"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ping URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted px-3 py-2 rounded-md font-mono text-sm mb-4 break-all">
                {pingUrl}
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold tracking-tight">Settings</h3>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-semibold">Created At</div>
                  <div className="text-sm">{format(new Date(check.createdAt), 'MMM d, yyyy')}</div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Check Name" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">Description</span>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context about this check" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-bold">Group</span>
                    <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Production" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-bold">Tags (comma separated)</span>
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="web, db, critical" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-bold">Interval (minutes)</span>
                    <Input type="number" min="1" value={intervalMin} onChange={(e) => setIntervalMin(parseInt(e.target.value) || 1)} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-bold">Grace Period (minutes)</span>
                    <Input type="number" min="1" value={graceMin} onChange={(e) => setGraceMin(parseInt(e.target.value) || 1)} />
                  </label>
                </div>
              </div>

              {settingsMessage && (
                <Alert className="mb-4" variant={settingsMessage.type === 'error' ? 'destructive' : 'default'}>
                  {settingsMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertTitle>{settingsMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                  <AlertDescription>{settingsMessage.text}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSaveSettings} disabled={settingsSaving} variant="secondary">
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Pings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Relative</TableHead>
                      <TableHead>Payload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No pings received yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {pings.map(ping => (
                      <TableRow key={ping.id}>
                        <TableCell>{format(new Date(ping.createdAt), 'PPpp')}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(ping.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          {ping.hasPayload ? (
                            <Button variant="secondary" size="sm" onClick={() => setSelectedPingForPayload(ping)}>
                              <FileText className="w-4 h-4 mr-2" /> View
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedPingForPayload} onOpenChange={(open: boolean) => !open && setSelectedPingForPayload(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ping Payload</DialogTitle>
            <DialogDescription>
              Payload details for ping at {selectedPingForPayload && format(new Date(selectedPingForPayload.createdAt), 'PPpp')}
            </DialogDescription>
          </DialogHeader>

          {selectedPingForPayload && <PayloadViewer pingId={selectedPingForPayload.id} />}

          <div className="flex gap-3 mt-4 justify-end">
            {selectedPingForPayload && (
              <>
                <Button
                  variant="secondary"
                  className="bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/payload/${selectedPingForPayload.id}`)}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Permlink
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(`/payload/${selectedPingForPayload.id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setSelectedPingForPayload(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
