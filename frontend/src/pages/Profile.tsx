import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Card, Flex, Button, Avatar } from '@radix-ui/themes';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';
import { User } from '@healthchecks/shared';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Pick<User, 'username' | 'displayName' | 'description' | 'createdAt'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      try {
        const data = await ApiClient.getPublicProfile(username);
        setProfile(data);
      } catch (err) {
        if ((err as Error).message.includes('404') || (err as Error).message.includes('Not found')) {
          setError('User not found');
        } else {
          setError((err as Error).message || 'Error loading profile');
        }
      }
    };
    fetchProfile();
  }, [username]);

  if (error) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4" align="center">
          <Text color="ruby">{error}</Text>
          <Button variant="soft" color="gray" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Back to Dashboard</Button>
        </Flex>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container size="2" py="6">
        <Text color="gray">Loading profile...</Text>
      </Container>
    );
  }

  return (
    <Container size="2" py="6">
      <Flex mb="6" align="center" gap="3">
        <Button variant="ghost" color="gray" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><ArrowLeft size={16} /> Back</Button>
      </Flex>
      <Card size="4" variant="surface">
        <Flex direction="column" align="center" gap="4">
          <Avatar
            size="9"
            fallback={profile.displayName ? profile.displayName[0].toUpperCase() : profile.username[0].toUpperCase()}
            radius="full"
            color="iris"
          />
          <Heading size="7" style={{ color: 'var(--slate-12)' }}>{profile.displayName || profile.username}</Heading>
          <Text color="gray" size="4">@{profile.username}</Text>

          {profile.description ? (
            <Text mt="4" align="center" style={{ whiteSpace: 'pre-wrap', color: 'var(--slate-11)' }}>
              {profile.description}
            </Text>
          ) : (
            <Text mt="4" color="gray" style={{ fontStyle: 'italic' }}>No description provided.</Text>
          )}

          <Text size="2" color="gray" mt="6">
            Joined {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
          </Text>
        </Flex>
      </Card>
    </Container>
  );
}
