import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Flex, Button, TextField, Text, TextArea, Callout } from '@radix-ui/themes';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';

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
    <Container size="3" py="6">
      <Flex mb="6" align="center" gap="3">
        <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={16} /> Dashboard</Button>
      </Flex>

      <Heading size="8" mb="6">Settings</Heading>

      <Flex direction="column" gap="8">
        {/* Profile Form */}
        <Flex direction="column" gap="4">
          <Heading size="5">Profile</Heading>

          {profileMessage && (
            <Callout.Root color={profileMessage.type === 'success' ? 'green' : 'red'}>
              <Callout.Icon>{profileMessage.type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>}</Callout.Icon>
              <Callout.Text>{profileMessage.text}</Callout.Text>
            </Callout.Root>
          )}

          <form onSubmit={handleUpdateProfile}>
            <Flex direction="column" gap="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Display Name</Text>
                <TextField.Root
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Description</Text>
                <TextArea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us about yourself..."
                  style={{ minHeight: 100 }}
                />
              </label>

              <Button type="submit" mt="2" style={{ alignSelf: 'flex-start' }}>Save Profile</Button>
            </Flex>
          </form>
        </Flex>

        {/* Password Form */}
        <Flex direction="column" gap="4">
          <Heading size="5">Change Password</Heading>

          {passwordMessage && (
            <Callout.Root color={passwordMessage.type === 'success' ? 'green' : 'red'}>
              <Callout.Icon>{passwordMessage.type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>}</Callout.Icon>
              <Callout.Text>{passwordMessage.text}</Callout.Text>
            </Callout.Root>
          )}

          <form onSubmit={handleChangePassword}>
            <Flex direction="column" gap="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Current Password</Text>
                <TextField.Root
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">New Password</Text>
                <TextField.Root
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <Button type="submit" mt="2" color="ruby" style={{ alignSelf: 'flex-start' }}>Update Password</Button>
            </Flex>
          </form>
        </Flex>
      </Flex>
    </Container>
  );
}
