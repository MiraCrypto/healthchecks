import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Card, Flex, Button, Avatar } from '@radix-ui/themes';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface ProfileData {
  username: string;
  displayName: string | null;
  description: string | null;
  createdAt: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError('Error loading profile');
      }
    };
    fetchProfile();
  }, [username]);

  if (error) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4" align="center">
          <Text color="red">{error}</Text>
          <Button variant="soft" onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Flex>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container size="2" py="6">
        <Text>Loading profile...</Text>
      </Container>
    );
  }

  return (
    <Container size="2" py="6">
      <Flex mb="6" align="center" gap="3">
        <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={16} /> Dashboard</Button>
      </Flex>
      <Card size="4">
        <Flex direction="column" align="center" gap="4">
          <Avatar
            size="8"
            fallback={profile.displayName ? profile.displayName[0].toUpperCase() : profile.username[0].toUpperCase()}
            radius="full"
          />
          <Heading size="6">{profile.displayName || profile.username}</Heading>
          <Text color="gray" size="3">@{profile.username}</Text>

          {profile.description ? (
            <Text mt="4" align="center" style={{ whiteSpace: 'pre-wrap' }}>
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
