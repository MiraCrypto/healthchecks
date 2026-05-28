import type { FormEvent } from 'react'
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiClient } from '../api/ApiClient.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await ApiClient.login({ username, password })
      navigate('/')
    }
    catch (err) {
      setError((err as Error).message || 'Login failed')
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <Container size="2">
        <Card size="4" variant="surface">
          <Heading size="6" mb="6" align="center">Healthchecks</Heading>
          <form onSubmit={handleLogin}>
            <Flex direction="column" gap="4">
              <TextField.Root size="3" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <TextField.Root size="3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <Text color="ruby" size="2" align="center">{error}</Text>}
              <Button size="3" variant="solid" type="submit">Sign In</Button>
              <Text align="center" size="2" color="gray">
                Don't have an account?
                {' '}
                <Link to="/register" style={{ color: 'var(--accent-9)', textDecoration: 'none', fontWeight: 500 }}>Sign Up</Link>
              </Text>
            </Flex>
          </form>
        </Card>
      </Container>
    </Flex>
  )
}
