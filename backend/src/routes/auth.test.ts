import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildServer } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('Auth routes', () => {
  let app: FastifyInstance;
  
  const mockUserRepo = {
    findByUsername: vi.fn(),
    count: vi.fn(),
    insert: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findAll: vi.fn(),
  };

  const mockCheckRepo = {};
  const mockPingRepo = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['JWT_SECRET'] = 'testsecret';
    process.env['COOKIE_SECRET'] = 'testcookie';
    
    app = await buildServer({
      userRepo: mockUserRepo as any,
      checkRepo: mockCheckRepo as any,
      pingRepo: mockPingRepo as any,
    });
    
    await app.ready();
  });

  it('should register a new user', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockUserRepo.count.mockResolvedValue(0); // first user -> admin
    mockUserRepo.insert.mockResolvedValue(undefined);

    const response = await supertest(app.server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Registered successfully');
    expect(response.headers['set-cookie']).toBeDefined();
    expect(mockUserRepo.insert).toHaveBeenCalledOnce();
  });

  it('should fail to register if user exists', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({ id: '1', username: 'testuser' });

    const response = await supertest(app.server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username already taken');
  });

  it('should login an existing user', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('password123', 10);
    mockUserRepo.findByUsername.mockResolvedValue({ id: '1', username: 'testuser', passwordHash: hash, role: 'USER' });

    const response = await supertest(app.server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged in');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should logout a user', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '1', username: 'testuser', role: 'USER' }, 'testsecret');
    const response = await supertest(app.server)
      .post('/api/auth/logout')
      .set('Cookie', [`auth_token=${token}`])
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out');
  });

  it('should return me', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({
      id: '1', username: 'testuser', role: 'USER', displayName: null, description: null, createdAt: new Date().toISOString()
    });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '1', username: 'testuser', role: 'USER' }, 'testsecret');

    const response = await supertest(app.server)
      .get('/api/auth/me')
      .set('Cookie', [`auth_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });
});
