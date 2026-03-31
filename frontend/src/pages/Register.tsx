import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApiClient } from '../api/ApiClient.js';

import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.js";

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await ApiClient.register({ username, password });
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Registration failed');
    }
  };

  return (
    <div className="container mx-auto max-w-sm pt-[10vh]">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">Healthchecks - Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="flex flex-col gap-4">
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Sign Up</Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="hover:underline text-primary">Sign In</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
