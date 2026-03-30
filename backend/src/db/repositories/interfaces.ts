import { Check, Ping, User } from '@healthchecks/shared';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findByUsername(username: string): Promise<(User & { passwordHash: string }) | null>;
  findById(id: string): Promise<(User & { passwordHash: string }) | null>;
  insert(data: User & { passwordHash: string }): Promise<void>;
  update(id: string, data: Partial<User> & { passwordHash?: string }): Promise<void>;
  count(): Promise<number>;
}

export interface ICheckRepository {
  findAll(userId: string): Promise<Check[]>;
  findById(id: string, userId: string): Promise<Check | null>;
  findByIdUnscoped(id: string): Promise<Check | null>;
  insert(data: Check): Promise<void>;
  update(id: string, userId: string, data: Partial<Check>): Promise<void>;
  updateUnscoped(id: string, data: Partial<Check>): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}

export interface IPingRepository {
  insert(data: Omit<Ping, 'hasPayload'> & { payload?: Buffer; mimeType?: string | null }): Promise<void>;
  findByCheckId(checkId: string, limit?: number): Promise<Ping[]>;
  findPayloadById(id: string): Promise<{ payload: Buffer | null; mimeType: string | null } | null>;
}
