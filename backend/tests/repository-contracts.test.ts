import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Repository contracts are correctly implemented by DatabaseFactory singletons', async () => {
  // Set required environment variables before importing the factory
  process.env.DB_DIALECT = 'postgres';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/healthchecks_test';

  // Dynamically import to ensure environment variables are evaluated during the module's initialization
  const { userRepo, checkRepo, pingRepo } = await import('../src/db/DatabaseFactory.js');

  // Verify Singletons exist
  assert.ok(userRepo, 'userRepo should be instantiated');
  assert.ok(checkRepo, 'checkRepo should be instantiated');
  assert.ok(pingRepo, 'pingRepo should be instantiated');

  // Verify IUserRepository contract
  assert.strictEqual(typeof userRepo.findAll, 'function', 'userRepo missing findAll');
  assert.strictEqual(typeof userRepo.findById, 'function', 'userRepo missing findById');
  assert.strictEqual(typeof userRepo.findByUsername, 'function', 'userRepo missing findByUsername');
  assert.strictEqual(typeof userRepo.insert, 'function', 'userRepo missing insert');
  assert.strictEqual(typeof userRepo.update, 'function', 'userRepo missing update');
  assert.strictEqual(typeof userRepo.count, 'function', 'userRepo missing count');

  // Verify ICheckRepository contract
  assert.strictEqual(typeof checkRepo.findAll, 'function', 'checkRepo missing findAll');
  assert.strictEqual(typeof checkRepo.findById, 'function', 'checkRepo missing findById');
  assert.strictEqual(typeof checkRepo.findByIdUnscoped, 'function', 'checkRepo missing findByIdUnscoped');
  assert.strictEqual(typeof checkRepo.insert, 'function', 'checkRepo missing insert');
  assert.strictEqual(typeof checkRepo.update, 'function', 'checkRepo missing update');
  assert.strictEqual(typeof checkRepo.updateUnscoped, 'function', 'checkRepo missing updateUnscoped');
  assert.strictEqual(typeof checkRepo.delete, 'function', 'checkRepo missing delete');

  // Verify IPingRepository contract
  assert.strictEqual(typeof pingRepo.insert, 'function', 'pingRepo missing insert');
  assert.strictEqual(typeof pingRepo.findByCheckId, 'function', 'pingRepo missing findByCheckId');
  assert.strictEqual(typeof pingRepo.findPayloadById, 'function', 'pingRepo missing findPayloadById');
});
