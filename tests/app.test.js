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

const app = require('../src/index');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

const mockUserId = '64a1b2c3d4e5f6a7b8c9d0e1';
const mockToken = jwt.sign({ id: mockUserId, username: 'testuser' }, JWT_SECRET);

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
    const fakeUser = { _id: mockUserId, username: 'testuser', email: 'test@test.com' };
    User.create.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
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
    const fakeUser = {
      _id: mockUserId,
      username: 'testuser',
      email: 'test@test.com',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
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
