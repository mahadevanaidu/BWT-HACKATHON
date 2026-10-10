import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User.model';

const TEST_USER = {
  email: 'test.admin@verity.test',
  password: 'TestAdmin@2024!',
  name: 'Test Admin',
  role: 'admin' as const,
};

let authToken: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/verity_test';
  await mongoose.connect(uri);
  await User.deleteMany({ email: TEST_USER.email });
  await User.create(TEST_USER);
});

afterAll(async () => {
  await User.deleteMany({ email: TEST_USER.email });
  await mongoose.disconnect();
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: TEST_USER.email,
      name: TEST_USER.name,
      role: TEST_USER.role,
    });
    expect(res.body.user).not.toHaveProperty('password');
    authToken = res.body.token;
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    if (!authToken) {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
      authToken = loginRes.body.token;
    }

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: TEST_USER.email });
  });

  it('should reject requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
