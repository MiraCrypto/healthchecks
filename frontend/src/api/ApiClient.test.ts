import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from './ApiClient.js';

describe('ApiClient', () => {
  it('should be defined', () => {
    expect(ApiClient).toBeDefined();
  });
  
  function mockFetch(data: any, ok: boolean = true) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok,
      text: async () => typeof data === 'string' ? data : JSON.stringify(data),
      json: async () => data,
      statusText: 'Error',
      headers: new Headers({'Content-Type': 'text/plain'}),
    });
  }

  it('should handle fetch api ok', async () => {
    mockFetch({ message: 'ok' });
    const res = await ApiClient.register({ username: 'u', password: 'p' });
    expect(res.message).toBe('ok');
    
    mockFetch({ message: 'ok' });
    const login = await ApiClient.login({ username: 'u', password: 'p' });
    expect(login.message).toBe('ok');

    mockFetch({ message: 'ok' });
    const logout = await ApiClient.logout();
    expect(logout.message).toBe('ok');

    mockFetch({ id: '1' });
    const me = await ApiClient.getMe();
    expect(me.id).toBe('1');

    mockFetch({ message: 'ok' });
    const up = await ApiClient.updateProfile({});
    expect(up.message).toBe('ok');

    mockFetch({ message: 'ok' });
    const cp = await ApiClient.changePassword({ currentPassword: '', newPassword: '' });
    expect(cp.message).toBe('ok');

    mockFetch({ username: 'a' });
    const gp = await ApiClient.getPublicProfile('a');
    expect(gp.username).toBe('a');

    mockFetch([]);
    const gu = await ApiClient.getUsers();
    expect(gu).toEqual([]);

    mockFetch({ message: 'ok' });
    const cu = await ApiClient.createUser({ username: '', password: '', role: 'USER' });
    expect(cu.message).toBe('ok');

    mockFetch({ message: 'ok' });
    const ur = await ApiClient.updateUserRole('1', { role: 'ADMIN' });
    expect(ur.message).toBe('ok');

    mockFetch([]);
    const gc = await ApiClient.getChecks();
    expect(gc).toEqual([]);

    mockFetch({ id: '1' });
    const gco = await ApiClient.getCheck('1');
    expect(gco.id).toBe('1');

    mockFetch({ id: '1' });
    const cc = await ApiClient.createCheck({ name: '' });
    expect(cc.id).toBe('1');

    mockFetch({ id: '1' });
    const uc = await ApiClient.updateCheck('1', {});
    expect(uc.id).toBe('1');

    mockFetch({ success: true });
    const dc = await ApiClient.deleteCheck('1');
    expect(dc.success).toBe(true);

    mockFetch([]);
    const gcp = await ApiClient.getCheckPings('1');
    expect(gcp).toEqual([]);
    
    mockFetch('payload data');
    const pt = await ApiClient.getPayloadText('1');
    expect(pt.text).toBe('payload data');
  });

  it('should handle fetch api errors', async () => {
    mockFetch({ error: 'failed' }, false);
    await expect(ApiClient.getChecks()).rejects.toThrow('failed');

    // non-json error
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => { throw new Error() },
      statusText: 'Forbidden',
      text: async () => '',
    });
    await expect(ApiClient.getChecks()).rejects.toThrow('Forbidden');
    
    // empty text ok
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    expect(await ApiClient.getChecks()).toBe(null);

    // non-json ok
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'hello',
    });
    expect(await ApiClient.getChecks()).toBe('hello');
  });

  it('should handle payload errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'some payload error',
      statusText: 'Forbidden',
    });
    await expect(ApiClient.getPayloadText('1')).rejects.toThrow('some payload error');
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => { throw new Error() },
      statusText: 'Forbidden',
    });
    await expect(ApiClient.getPayloadText('1')).rejects.toThrow('Forbidden');
  });
});
