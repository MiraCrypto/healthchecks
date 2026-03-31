import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Heading, Text, TextField, Button, Flex } from '@radix-ui/themes';
import { ApiClient } from '../api/ApiClient.js';

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
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <Container size="2">
        <Card size="4" variant="surface">
          <Heading size="6" mb="6" align="center">Healthchecks - Register</Heading>
          <form onSubmit={handleRegister}>
            <Flex direction="column" gap="4">
              <TextField.Root size="3" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <TextField.Root size="3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <Text color="ruby" size="2" align="center">{error}</Text>}
              <Button size="4" variant="solid" type="submit" highContrast>Sign Up</Button>
              <Text align="center" size="2" color="gray">
                Already have an account? <Link to="/login" style={{ color: 'var(--accent-9)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
              </Text>
            </Flex>
          </form>
        </Card>
      </Container>
    </Flex>
  );
}
