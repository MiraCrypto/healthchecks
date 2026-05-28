import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

describe('Checks routes', () => {
  let app: FastifyInstance;
  let token: string;
  
  const mockUserRepo = {};
  const mockCheckRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const mockPingRepo = {
    findByCheckId: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['JWT_SECRET'] = 'testsecret';
    token = jwt.sign({ id: 'u1', username: 'test', role: 'USER' }, 'testsecret');
    
    app = await buildServer({
      userRepo: mockUserRepo as any,
      checkRepo: mockCheckRepo as any,
      pingRepo: mockPingRepo as any,
    });
    
    await app.ready();
  });

  it('should get checks', async () => {
    mockCheckRepo.findAll.mockResolvedValue([]);
    const res = await supertest(app.server).get('/api/checks').set('Cookie', [`auth_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should get check by id', async () => {
    mockCheckRepo.findById.mockResolvedValue({ id: 'c1', name: 'Check 1' });
    const res = await supertest(app.server).get('/api/checks/123e4567-e89b-12d3-a456-426614174000').set('Cookie', [`auth_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Check 1');
  });

  it('should get pings by check id', async () => {
    mockCheckRepo.findById.mockResolvedValue({ id: 'c1', name: 'Check 1' });
    mockPingRepo.findByCheckId.mockResolvedValue([]);
    const res = await supertest(app.server).get('/api/checks/123e4567-e89b-12d3-a456-426614174000/pings').set('Cookie', [`auth_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should create a check', async () => {
    mockCheckRepo.insert.mockResolvedValue(undefined);
    const res = await supertest(app.server)
      .post('/api/checks')
      .set('Cookie', [`auth_token=${token}`])
      .send({ name: 'New Check' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Check');
  });

  it('should update a check', async () => {
    mockCheckRepo.update.mockResolvedValue(undefined);
    mockCheckRepo.findById.mockResolvedValue({ id: 'c1', name: 'Updated Check' });
    const res = await supertest(app.server)
      .put('/api/checks/123e4567-e89b-12d3-a456-426614174000')
      .set('Cookie', [`auth_token=${token}`])
      .send({ name: 'Updated Check' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Check');
  });

  it('should delete a check', async () => {
    mockCheckRepo.delete.mockResolvedValue(undefined);
    const res = await supertest(app.server)
      .delete('/api/checks/123e4567-e89b-12d3-a456-426614174000')
      .set('Cookie', [`auth_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

