const request = require('supertest');

// Mock mongoose before requiring app
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock models
jest.mock('../src/models/User');
jest.mock('../src/models/Post');

// Mock email and phone utils to prevent side effects
jest.mock('../src/utils/email', () => ({
  sendVerificationCode: jest.fn().mockResolvedValue(null),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(null),
  sendMagicLinkEmail: jest.fn().mockResolvedValue(null),
  sendNewDeviceAlert: jest.fn().mockResolvedValue(null),
  sendEmail: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/utils/phone', () => ({
  sendPhoneOTP: jest.fn().mockResolvedValue({ status: 'pending' }),
  verifyPhoneOTP: jest.fn().mockResolvedValue({ status: 'approved' }),
}));

const app = require('../src/index');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

const mockUserId = '64a1b2c3d4e5f6a7b8c9d0e1';
const mockSessionId = '64a1b2c3d4e5f6a7b8c9d0e2';
const mockToken = jwt.sign({ id: mockUserId, username: 'testuser', sessionId: mockSessionId }, JWT_SECRET);

/**
 * Create a mock user object with all methods needed by the auth system.
 */
function createMockUser(overrides = {}) {
  const sessions = overrides.sessions || [];
  // Add Mongoose-like array helpers
  sessions.pull = sessions.pull || function (id) {
    const idx = this.findIndex((s) => s._id && s._id.toString() === id.toString());
    if (idx !== -1) this.splice(idx, 1);
  };
  sessions.id = sessions.id || function (id) {
    return this.find((s) => s._id && s._id.toString() === id.toString());
  };
  // Wrap push to auto-assign _id
  const origPush = sessions.push.bind(sessions);
  sessions.push = function (...items) {
    items.forEach((item) => {
      if (!item._id) item._id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    });
    return origPush(...items);
  };

  const user = {
    _id: mockUserId,
    username: 'testuser',
    email: 'test@test.com',
    providers: ['local'],
    sessions,
    emailVerified: false,
    loginAttempts: 0,
    save: jest.fn().mockResolvedValue(undefined),
    isLocked: jest.fn().mockReturnValue(false),
    comparePassword: jest.fn().mockResolvedValue(true),
    incLoginAttempts: jest.fn().mockResolvedValue(undefined),
    resetLoginAttempts: jest.fn().mockResolvedValue(undefined),
    ...overrides,
    // Ensure sessions is always the enhanced array
  };
  if (!overrides.sessions) user.sessions = sessions;
  return user;
}

describe('Health endpoint', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth routes', () => {
  afterEach(() => jest.clearAllMocks());

  it('POST /api/auth/register – 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'u' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register – 201 on success', async () => {
    User.findOne.mockResolvedValue(null);
    const fakeUser = createMockUser();
    User.create.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('POST /api/auth/register – 409 when user exists', async () => {
    User.findOne.mockResolvedValue({ _id: mockUserId });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login – 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login – 401 when credentials invalid', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad@bad.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login – 200 on success', async () => {
    const fakeUser = createMockUser();
    User.findOne.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('POST /api/auth/login – 423 when account is locked', async () => {
    const lockedUser = createMockUser({ isLocked: jest.fn().mockReturnValue(true) });
    User.findOne.mockResolvedValue(lockedUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(423);
  });

  it('POST /api/auth/login – 401 increments attempts on wrong password', async () => {
    const fakeUser = createMockUser({
      comparePassword: jest.fn().mockResolvedValue(false),
      loginAttempts: 0,
    });
    User.findOne.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(fakeUser.incLoginAttempts).toHaveBeenCalled();
  });

  it('POST /api/auth/refresh – 400 when no token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/forgot-password – returns success even for unknown email', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@test.com' });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/magic-link/send – returns success even for unknown email', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/magic-link/send')
      .send({ email: 'unknown@test.com' });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/phone/send-otp – 400 when no phone', async () => {
    const res = await request(app).post('/api/auth/phone/send-otp').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/phone/verify-otp – 400 when missing fields', async () => {
    const res = await request(app).post('/api/auth/phone/verify-otp').send({ phone: '+123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/logout – 401 without auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/logout – 200 with auth', async () => {
    const fakeUser = createMockUser({
      sessions: [{ _id: mockSessionId, deviceId: 'dev1', toString: () => mockSessionId }],
    });
    fakeUser.sessions.filter = Array.prototype.filter.bind(fakeUser.sessions);
    User.findById.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${mockToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/sessions – 200 with auth', async () => {
    const fakeUser = createMockUser({
      sessions: [
        {
          _id: mockSessionId,
          deviceId: 'dev1',
          deviceName: 'Test',
          deviceType: 'web',
          ipAddress: '127.0.0.1',
          lastUsedAt: new Date(),
          createdAt: new Date(),
          toString: () => mockSessionId,
        },
      ],
    });
    User.findById.mockResolvedValue(fakeUser);

    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${mockToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Posts routes', () => {
  afterEach(() => jest.clearAllMocks());

  const buildPopulate = (value) => ({
    populate: jest.fn().mockResolvedValue(value),
  });

  it('GET /api/posts – returns list of posts', async () => {
    const fakePosts = [{ _id: '1', content: 'hello', author: { username: 'u' } }];
    Post.find.mockReturnValue({
      sort: () => ({ populate: () => ({ populate: jest.fn().mockResolvedValue(fakePosts) }) }),
    });
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/posts/:id – 404 when not found', async () => {
    Post.findById.mockReturnValue({
      populate: () => ({ populate: jest.fn().mockResolvedValue(null) }),
    });
    const res = await request(app).get('/api/posts/nonexistent');
    expect(res.status).toBe(404);
  });

  it('POST /api/posts – 401 without auth', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'hello' });
    expect(res.status).toBe(401);
  });

  it('POST /api/posts – 400 without content', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/posts – 201 on success', async () => {
    const fakePost = {
      _id: 'p1',
      content: 'hello',
      author: { username: 'testuser' },
      populate: jest.fn().mockResolvedValue(undefined),
    };
    Post.create.mockResolvedValue(fakePost);

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ content: 'hello' });
    expect(res.status).toBe(201);
  });
});

describe('Users routes', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET /api/users/:username – 404 when not found', async () => {
    User.findOne.mockReturnValue({
      populate: () => ({ populate: jest.fn().mockResolvedValue(null) }),
    });
    const res = await request(app).get('/api/users/nobody');
    expect(res.status).toBe(404);
  });

  it('GET /api/users/:username – 200 on success', async () => {
    const fakeUser = { _id: mockUserId, username: 'testuser', followers: [], following: [] };
    User.findOne.mockReturnValue({
      populate: () => ({ populate: jest.fn().mockResolvedValue(fakeUser) }),
    });
    const res = await request(app).get('/api/users/testuser');
    expect(res.status).toBe(200);
  });
});
