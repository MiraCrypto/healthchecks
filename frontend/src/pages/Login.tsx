import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Heading, Text, TextField, Button, Flex } from '@radix-ui/themes';

import { Link } from 'react-router-dom';
import { ApiClient } from '../api/ApiClient.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await ApiClient.login({ username, password });
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    }
  };

  return (
    <Container size="1" style={{ paddingTop: '10vh' }}>
      <Card size="4">
        <Heading size="6" mb="4" align="center">Healthchecks</Heading>
        <form onSubmit={handleLogin}>
          <Flex direction="column" gap="3">
            <TextField.Root placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField.Root type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Text color="red" size="2">{error}</Text>}
            <Button size="3" type="submit">Sign In</Button>
            <Text align="center" size="2" color="gray">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
