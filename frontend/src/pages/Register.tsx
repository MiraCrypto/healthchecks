import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Heading, Text, TextField, Button, Flex } from '@radix-ui/themes';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <Container size="1" style={{ paddingTop: '10vh' }}>
      <Card size="4">
        <Heading size="6" mb="4" align="center">Healthchecks - Register</Heading>
        <form onSubmit={handleRegister}>
          <Flex direction="column" gap="3">
            <TextField.Root placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField.Root type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Text color="red" size="2">{error}</Text>}
            <Button size="3" type="submit">Sign Up</Button>
            <Text align="center" size="2" color="gray">
              Already have an account? <Link to="/login">Sign In</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
