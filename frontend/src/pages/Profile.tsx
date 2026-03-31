import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { ApiClient } from '../api/ApiClient.js';
import { User } from '@healthchecks/shared';

import { Button } from "@/components/ui/button.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.js";

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
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="flex flex-col gap-4 items-center">
          <span className="text-destructive">{error}</span>
          <Button variant="secondary" onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex mb-6 items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.displayName ? profile.displayName[0].toUpperCase() : profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.displayName || profile.username}
            </h1>
            <span className="text-muted-foreground text-lg">@{profile.username}</span>

            {profile.description ? (
              <p className="mt-4 text-center whitespace-pre-wrap">
                {profile.description}
              </p>
            ) : (
              <p className="mt-4 text-muted-foreground italic text-center">
                No description provided.
              </p>
            )}

            <span className="text-sm text-muted-foreground mt-6">
              Joined {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
