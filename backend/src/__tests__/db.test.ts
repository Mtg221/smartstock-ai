import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../config/prisma';

describe('Database & Model Verification', () => {
  after(async () => {
    await prisma.$disconnect().catch(() => {});
  });

  it('should initialize Prisma client and expose required models', () => {
    assert.ok(prisma.user, 'User model should exist');
    assert.ok(prisma.product, 'Product model should exist');
    assert.ok(prisma.sale, 'Sale model should exist');
    assert.ok(prisma.purchase, 'Purchase model should exist');
    assert.ok(prisma.company, 'Company model should exist');
    assert.ok(prisma.supplier, 'Supplier model should exist');
    assert.ok(prisma.notification, 'Notification model should exist');
  });

  it('should connect to database if DATABASE_URL is reachable', async () => {
    try {
      await prisma.$queryRaw`SELECT 1 as health`;
      assert.ok(true, 'Database is reachable and responsive');
    } catch (err: any) {
      if (process.env.CI) {
        throw err;
      }
      // If running locally without Docker postgres running, log warning but don't break local dev test
      console.log('Local DB unreachable, skipped live query:', err.message);
    }
  });
});
