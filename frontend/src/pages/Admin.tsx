import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '@healthchecks/shared';
import { ApiClient } from '../api/ApiClient.js';

import { Button } from "@/components/ui/button.js";
import { Badge } from "@/components/ui/badge.js";
import { Input } from "@/components/ui/input.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getUsers();
      setUsers(data);
    } catch (err) {
      if ((err as Error).message.includes('Forbidden') || (err as Error).message.includes('403')) {
        setError('Access Denied: Admins Only');
      } else {
        setError('Network Error or Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      await ApiClient.updateUserRole(userId, { role: newRole });
      loadUsers();
    } catch (err) {
      setError((err as Error).message || 'Error updating role');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex flex-col items-center gap-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex mb-6 items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
        <div className="flex gap-3 items-center">
          <Button variant="secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <CreateUserDialog onCreated={loadUsers} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <a href={`/u/${u.username}`} className="hover:underline">
                    {u.username}
                  </a>
                </TableCell>
                <TableCell>{u.displayName || '-'}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'destructive' : 'default'}>{u.role}</Badge>
                </TableCell>
                <TableCell>{format(new Date(u.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(val: 'USER'|'ADMIN') => handleRoleChange(u.id, val)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    setError('');
    try {
      await ApiClient.createUser({ username, password, role });
      setUsername('');
      setPassword('');
      setRole('USER');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError((err as Error).message || 'Error creating user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user directly to the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Username</span>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Password</span>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Role</span>
            <Select value={role} onValueChange={(val: 'USER'|'ADMIN') => setRole(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="flex gap-3 justify-end items-center mt-4">
          {error && <span className="text-sm text-destructive mr-auto">{error}</span>}
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
