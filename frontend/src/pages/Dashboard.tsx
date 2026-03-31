import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from '@healthchecks/shared';
import { formatDistanceToNow } from 'date-fns';
import { Plus, RefreshCw, LogOut, Settings as SettingsIcon, Shield, Edit2 } from 'lucide-react';
import { User } from '@healthchecks/shared';
import { ApiClient } from '../api/ApiClient.js';

import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Badge } from "@/components/ui/badge.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.js";

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
      case 'UP': return 'default'; // primary color or custom green
      case 'DOWN': return 'destructive';
      case 'PAUSED': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Checks</h1>
        <div className="flex gap-3 items-center">
          {user && (
            <span className="text-sm text-muted-foreground mr-2">
              Welcome, <a href={`/u/${user.username}`} className="font-bold hover:underline">{user.username}</a>
            </span>
          )}
          {user?.role === 'ADMIN' && (
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              <Shield className="w-4 h-4 mr-2" /> Admin
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            <SettingsIcon className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button variant="secondary" onClick={loadChecks} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <Input
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
      </div>

      {checks.length === 0 && (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No checks found. Create your first check above!
        </div>
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
        <div key={groupName} className="flex flex-col mb-6 gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{groupName}</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupChecks.map(check => (
                  <TableRow key={check.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span>{check.name}</span>
                          {check.tags && check.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        {check.description && (
                          <span className="text-xs text-muted-foreground">{check.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(check.status)}>{check.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {check.lastPing ? formatDistanceToNow(new Date(check.lastPing), { addSuffix: true }) : 'Never'}
                    </TableCell>
                    <TableCell>{(check.intervalSeconds / 60).toFixed(0)} min</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/checks/${check.id}`)}>
                          Details / Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

    </div>
  );
}
