import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

describe('Users, Ping, Payload routes', () => {
  let app: FastifyInstance;
  let token: string;
  let adminToken: string;
  
  const mockUserRepo = {
    findByUsername: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    insert: vi.fn(),
  };
  const mockCheckRepo = {
    findByIdUnscoped: vi.fn(),
    updateUnscoped: vi.fn(),
  };
  const mockPingRepo = {
    findPayloadById: vi.fn(),
    insert: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['JWT_SECRET'] = 'testsecret';
    token = jwt.sign({ id: 'u1', username: 'test', role: 'USER' }, 'testsecret');
    adminToken = jwt.sign({ id: 'a1', username: 'admin', role: 'ADMIN' }, 'testsecret');
    
    app = await buildServer({
      userRepo: mockUserRepo as any,
      checkRepo: mockCheckRepo as any,
      pingRepo: mockPingRepo as any,
    });
    
    await app.ready();
  });

  // User
  it('should get public profile', async () => {
    mockUserRepo.findByUsername.mockResolvedValue({ username: 'u' });
    const res = await supertest(app.server).get('/api/users/u').set('Cookie', [`auth_token=${token}`]);
    expect(res.status).toBe(200);
  });

  it('should update profile', async () => {
    mockUserRepo.update.mockResolvedValue(undefined);
    const res = await supertest(app.server).put('/api/users/me').set('Cookie', [`auth_token=${token}`]).send({ displayName: 'foo' });
    expect(res.status).toBe(200);
  });

  it('should get all users as admin', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);
    const res = await supertest(app.server).get('/api/users').set('Cookie', [`auth_token=${adminToken}`]);
    expect(res.status).toBe(200);
  });

  it('should create user as admin', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockUserRepo.insert.mockResolvedValue(undefined);
    const res = await supertest(app.server).post('/api/users').set('Cookie', [`auth_token=${adminToken}`]).send({ username: 'user2', password: 'password123', role: 'USER' });
    expect(res.status).toBe(200);
  });

  it('should update user role as admin', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    mockUserRepo.update.mockResolvedValue(undefined);
    const res = await supertest(app.server).put('/api/users/123e4567-e89b-12d3-a456-426614174000/role').set('Cookie', [`auth_token=${adminToken}`]).send({ role: 'ADMIN' });
    expect(res.status).toBe(200);
  });

  // Payload
  it('should get payload', async () => {
    mockPingRepo.findPayloadById.mockResolvedValue({ payload: Buffer.from('hello'), mimeType: 'text/plain' });
    const res = await supertest(app.server).get('/payload/p1');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hello');
  });

  // Ping
  it('should handle ping get', async () => {
    mockCheckRepo.findByIdUnscoped.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    mockPingRepo.insert.mockResolvedValue(undefined);
    mockCheckRepo.updateUnscoped.mockResolvedValue(undefined);
    
    const res = await supertest(app.server).get('/ping/123e4567-e89b-12d3-a456-426614174000');
    expect(res.status).toBe(200);
  });

  it('should handle ping post', async () => {
    mockCheckRepo.findByIdUnscoped.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    mockPingRepo.insert.mockResolvedValue(undefined);
    mockCheckRepo.updateUnscoped.mockResolvedValue(undefined);
    
    const res = await supertest(app.server).post('/ping/123e4567-e89b-12d3-a456-426614174000').send(Buffer.from('hello')).set('Content-Type', 'text/plain');
    expect(res.status).toBe(200);
  });
});
