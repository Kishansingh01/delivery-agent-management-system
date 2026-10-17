import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';
import { CacheService } from '../services/cacheService.js';
import { initRedis } from '../config/redis.js';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initRedis();
  await prisma.$connect();
  await prisma.deliveryAgent.deleteMany();
  await CacheService.flushAll();
  CacheService.resetMetrics();
});

afterAll(async () => {
  await prisma.deliveryAgent.deleteMany();
  await prisma.$disconnect();
});

describe('Delivery Agent CRUD & Redis Caching Integration Tests', () => {
  let createdAgentId: string;
  const testAgent = {
    name: 'Alex Rivera',
    email: 'alex.rivera@testdelivery.com',
    phone: '+1 (555) 789-0123',
    serviceArea: 'Downtown Central',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.9,
    activeOrders: 1,
  };

  describe('Health Check Endpoint', () => {
    it('GET /health - should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.services.database.status).toBe('ok');
    });
  });

  describe('POST /api/agents (Create)', () => {
    it('should create a new delivery agent with valid data', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send(testAgent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(testAgent.name);
      expect(res.body.data.email).toBe(testAgent.email);
      expect(res.body.data.status).toBe('active');

      createdAgentId = res.body.data.id;
    });

    it('should fail with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({
          name: 'Incomplete Agent',
          // missing email, phone, serviceArea
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should fail with 409 when email is already registered', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({
          ...testAgent,
          name: 'Another Alex',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should fail with 400 for invalid phone format', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({
          name: 'Bad Phone Agent',
          email: 'badphone@testdelivery.com',
          phone: 'abc-not-a-phone',
          serviceArea: 'Uptown',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/agents (Read List & Redis Caching)', () => {
    it('first call should result in Cache MISS', async () => {
      const res = await request(app).get('/api/agents?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(res.body.source).toBe('database');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('second identical call should result in Cache HIT', async () => {
      const res = await request(app).get('/api/agents?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('HIT');
      expect(res.body.source).toBe('cache');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter agents by status', async () => {
      const res = await request(app).get('/api/agents?status=active');
      expect(res.status).toBe(200);
      expect(res.body.data.every((a: any) => a.status === 'active')).toBe(true);
    });

    it('should search agents by keyword', async () => {
      const res = await request(app).get('/api/agents?search=Alex');
      expect(res.status).toBe(200);
      expect(res.body.data.some((a: any) => a.name.includes('Alex'))).toBe(true);
    });
  });

  describe('GET /api/agents/:id (Read Detail & Redis Caching)', () => {
    it('first detail call should be Cache MISS', async () => {
      const res = await request(app).get(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(res.body.data.id).toBe(createdAgentId);
    });

    it('subsequent detail call should be Cache HIT', async () => {
      const res = await request(app).get(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('HIT');
      expect(res.body.data.id).toBe(createdAgentId);
    });

    it('should return 404 for non-existent agent ID', async () => {
      const res = await request(app).get('/api/agents/non-existent-uuid-1234');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/agents/:id (Update & Cache Invalidation)', () => {
    it('should update an existing agent and invalidate cache', async () => {
      const updatedArea = 'Westside Industrial District';
      const res = await request(app)
        .put(`/api/agents/${createdAgentId}`)
        .send({
          serviceArea: updatedArea,
          status: 'on_delivery',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceArea).toBe(updatedArea);
      expect(res.body.data.status).toBe('on_delivery');

      // Now verify that reading detail again results in Cache MISS (because cache was invalidated)
      const detailRes = await request(app).get(`/api/agents/${createdAgentId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.headers['x-cache']).toBe('MISS');
      expect(detailRes.body.data.serviceArea).toBe(updatedArea);

      // Verify list cache was also invalidated
      const listRes = await request(app).get('/api/agents?page=1&limit=10');
      expect(listRes.status).toBe(200);
      expect(listRes.headers['x-cache']).toBe('MISS');
    });

    it('should return 404 when updating non-existent agent', async () => {
      const res = await request(app)
        .put('/api/agents/non-existent-agent-id')
        .send({ name: 'Phantom Agent' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/agents/:id (Delete & Cache Invalidation)', () => {
    it('should delete existing agent and invalidate cache', async () => {
      const res = await request(app).delete(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Fetching deleted agent now returns 404
      const fetchRes = await request(app).get(`/api/agents/${createdAgentId}`);
      expect(fetchRes.status).toBe(404);
    });

    it('should return 404 when deleting an already deleted agent', async () => {
      const res = await request(app).delete(`/api/agents/${createdAgentId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/agents/meta/stats', () => {
    it('should return aggregated metrics', async () => {
      const res = await request(app).get('/api/agents/meta/stats');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalAgents');
      expect(res.body.data).toHaveProperty('activeAgents');
      expect(res.body.data).toHaveProperty('serviceAreas');
    });
  });
});
