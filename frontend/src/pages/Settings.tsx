import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';

import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";

export default function Settings() {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await ApiClient.getMe();
        setDisplayName(data.displayName || '');
        setDescription(data.description || '');
      } catch (err) {
        if ((err as Error).message === 'Unauthorized' || (err as Error).message.includes('401')) {
          navigate('/login');
        } else {
          console.error(err);
        }
      }
    };
    loadUser();
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await ApiClient.updateProfile({ displayName: displayName.trim() || null, description: description.trim() || null });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: (err as Error).message || 'Failed to update profile' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill out both password fields' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    try {
      await ApiClient.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: (err as Error).message || 'Failed to change password' });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex mb-6 items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>
      </div>

      <h1 className="text-4xl font-bold tracking-tight mb-6">Settings</h1>

      <div className="flex flex-col gap-8">
        {/* Profile Form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>

          {profileMessage && (
            <Alert variant={profileMessage.type === 'error' ? 'destructive' : 'default'}>
              {profileMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              <AlertTitle>{profileMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription>{profileMessage.text}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">Display Name</span>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">Description</span>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
              </label>

              <Button type="submit" className="mt-2 self-start">Save Profile</Button>
            </div>
          </form>
        </div>

        {/* Password Form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Change Password</h2>

          {passwordMessage && (
            <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
              {passwordMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              <AlertTitle>{passwordMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription>{passwordMessage.text}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">Current Password</span>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">New Password</span>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <Button type="submit" variant="destructive" className="mt-2 self-start">Update Password</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
