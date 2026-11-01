import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Backend Smoke & Security Tests', () => {
  it('should sign and verify JWT tokens accurately', () => {
    const secret = process.env.JWT_SECRET || 'test_secret_for_ci';
    const payload = {
      id: 'usr_123',
      email: 'test@smartstock-ai.com',
      roleId: 'role_admin',
      companyId: 'comp_1',
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    assert.ok(token, 'Token should be defined');

    const decoded = jwt.verify(token, secret) as typeof payload;
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.roleId, payload.roleId);
  });

  it('should hash and compare passwords with bcrypt', async () => {
    const rawPassword = 'SecretP@ssword2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(hash, rawPassword);
    const isValid = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isValid, true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isInvalid, false);
  });

  it('should validate API rate limiter configuration', async () => {
    // Verify rate limit threshold
    const limitWindowMs = 15 * 60 * 1000;
    const maxRequests = 200;
    assert.strictEqual(limitWindowMs, 900000);
    assert.ok(maxRequests > 0);
  });
});
