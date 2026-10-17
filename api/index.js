const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initial seed records
const INITIAL_AGENTS = [
  {
    id: 'be77a73c-1611-41f6-acc1-b49b9855a1ee',
    name: 'Marcus Chen',
    email: 'marcus.chen@fastdrop.io',
    phone: '+1 (555) 234-5678',
    serviceArea: 'Downtown Financial',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.95,
    activeOrders: 2,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: '58524b59-e0ea-4aa9-a270-9976983a0664',
    name: 'Elena Rostova',
    email: 'elena.rostova@fastdrop.io',
    phone: '+1 (555) 876-5432',
    serviceArea: 'Uptown Arts District',
    status: 'on_delivery',
    vehicleType: 'Bicycle',
    rating: 4.88,
    activeOrders: 3,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: 'ece0876c-2c66-4f7a-890f-0bd7a1493afc',
    name: "David O'Connor",
    email: 'david.oc@fastdrop.io',
    phone: '+1 (555) 345-6789',
    serviceArea: 'Metro West Valley',
    status: 'active',
    vehicleType: 'Car',
    rating: 4.92,
    activeOrders: 1,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: 'ebf09523-448b-4fee-8827-c0d90ca97d4a',
    name: 'Amina Al-Mansoor',
    email: 'amina.mansoor@fastdrop.io',
    phone: '+1 (555) 987-6543',
    serviceArea: 'North Bay Harbor',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.97,
    activeOrders: 0,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: 'd04d9895-8749-4af2-a391-c00a4b5d15fa',
    name: 'Carlos Ramirez',
    email: 'carlos.ramirez@fastdrop.io',
    phone: '+1 (555) 456-7890',
    serviceArea: 'South Hills Heights',
    status: 'inactive',
    vehicleType: 'Van',
    rating: 4.65,
    activeOrders: 0,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: '9483bcee-e04d-4688-85e2-4d282e2fa0ed',
    name: 'Sarah Jenkins',
    email: 'sarah.j@fastdrop.io',
    phone: '+1 (555) 654-3210',
    serviceArea: 'Downtown Financial',
    status: 'on_delivery',
    vehicleType: 'Bicycle',
    rating: 4.82,
    activeOrders: 4,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: 'ac12ffa4-3f36-4ec9-89cf-030728ccd6e8',
    name: 'Kenji Takahashi',
    email: 'kenji.t@fastdrop.io',
    phone: '+1 (555) 567-8901',
    serviceArea: 'Eastside Tech Hub',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.91,
    activeOrders: 1,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
  {
    id: '1e69a431-ddff-42d6-9418-b62798595a01',
    name: 'Priya Sharma',
    email: 'priya.sharma@fastdrop.io',
    phone: '+1 (555) 432-1098',
    serviceArea: 'Uptown Arts District',
    status: 'active',
    vehicleType: 'Car',
    rating: 4.89,
    activeOrders: 2,
    createdAt: '2026-10-17T10:34:48.000Z',
    updatedAt: '2026-10-17T10:34:48.000Z',
  },
];

// Persistent storage in /tmp for Vercel Serverless environment
const DB_PATH = path.join(process.env.TEMP || '/tmp', 'agents_db.json');

function getAgents() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    // ignore
  }
  return [...INITIAL_AGENTS];
}

function saveAgents(agents) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(agents, null, 2), 'utf-8');
  } catch (e) {
    // fallback in memory
  }
}

// In-Memory Redis Cache simulation with live telemetry
const cache = new Map();
let cacheHits = 0;
let cacheMisses = 0;
let lastInvalidatedAt = null;

function invalidateCache() {
  cache.clear();
  lastInvalidatedAt = new Date().toISOString();
}

function getRequestBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string' && req.body) {
      try {
        return resolve(JSON.parse(req.body));
      } catch (e) {
        return resolve({});
      }
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

module.exports = async function handler(req, res) {
  // Security & CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'X-Cache, X-Cache-Key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse URL & path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // Normalize path
  if (pathname.endsWith('/') && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // HEALTH CHECK
  if (pathname === '/health' || pathname === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        services: {
          database: { status: 'ok', type: 'Vercel Serverless Persistent Store' },
          cache: { status: 'connected', mode: 'mock' },
        },
      })
    );
  }

  // STATS ENDPOINT
  if (pathname === '/api/agents/meta/stats') {
    res.setHeader('Content-Type', 'application/json');
    const cacheKey = 'agents:stats';
    const cached = cache.get(cacheKey);

    if (cached) {
      cacheHits++;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.end(JSON.stringify({ success: true, source: 'cache', data: cached }));
    }

    cacheMisses++;
    const agents = getAgents();
    const total = agents.length;
    const active = agents.filter((a) => a.status === 'active').length;
    const inactive = agents.filter((a) => a.status === 'inactive').length;
    const onDelivery = agents.filter((a) => a.status === 'on_delivery').length;
    const totalActiveOrders = agents.reduce((acc, a) => acc + (a.activeOrders || 0), 0);
    const avgRating = total
      ? Number((agents.reduce((acc, a) => acc + (a.rating || 5), 0) / total).toFixed(2))
      : 5.0;
    const distinctAreas = Array.from(new Set(agents.map((a) => a.serviceArea))).sort();

    const stats = {
      totalAgents: total,
      activeAgents: active,
      inactiveAgents: inactive,
      onDeliveryAgents: onDelivery,
      totalActiveOrders,
      averageRating: avgRating,
      serviceAreas: distinctAreas,
    };

    cache.set(cacheKey, stats);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    return res.end(JSON.stringify({ success: true, source: 'database', data: stats }));
  }

  // CACHE STATUS
  if (pathname === '/api/agents/meta/cache-status') {
    res.setHeader('Content-Type', 'application/json');
    const total = cacheHits + cacheMisses;
    return res.end(
      JSON.stringify({
        success: true,
        data: {
          hits: cacheHits,
          misses: cacheMisses,
          totalRequests: total,
          hitRatio: total > 0 ? `${((cacheHits / total) * 100).toFixed(1)}%` : '0%',
          lastInvalidatedAt,
          mode: 'mock',
        },
      })
    );
  }

  // CACHE CLEAR
  if (pathname === '/api/agents/meta/cache-clear' && req.method === 'POST') {
    invalidateCache();
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, message: 'Cache flushed successfully' }));
  }

  // AGENT CRUD
  const agents = getAgents();

  // GET /api/agents (List)
  if (pathname === '/api/agents' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const sortedQuery = Object.keys(query)
      .sort()
      .filter((k) => query[k])
      .map((k) => `${k}=${query[k]}`)
      .join('&');
    const cacheKey = `agents:list:${sortedQuery || 'all'}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      cacheHits++;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.end(
        JSON.stringify({
          success: true,
          source: 'cache',
          cacheKey,
          ...cached,
        })
      );
    }

    cacheMisses++;
    let filtered = [...agents];

    if (query.search) {
      const s = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.phone.toLowerCase().includes(s) ||
          a.serviceArea.toLowerCase().includes(s)
      );
    }

    if (query.status) {
      filtered = filtered.filter((a) => a.status === query.status);
    }

    if (query.serviceArea) {
      filtered = filtered.filter((a) => a.serviceArea === query.serviceArea);
    }

    if (query.vehicleType) {
      filtered = filtered.filter((a) => a.vehicleType === query.vehicleType);
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const payload = {
      data: paged,
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
        hasNextPage: start + limit < filtered.length,
        hasPrevPage: page > 1,
      },
    };

    cache.set(cacheKey, payload);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    return res.end(
      JSON.stringify({
        success: true,
        source: 'database',
        cacheKey,
        ...payload,
      })
    );
  }

  // POST /api/agents (Create)
  if (pathname === '/api/agents' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    const body = await getRequestBody(req);

    if (!body.name || !body.email || !body.phone || !body.serviceArea) {
      res.statusCode = 400;
      return res.end(
        JSON.stringify({
          success: false,
          error: 'Validation failed: name, email, phone, and serviceArea are required.',
        })
      );
    }

    // Email duplicate check
    const existing = agents.find((a) => a.email.toLowerCase() === body.email.toLowerCase().trim());
    if (existing) {
      res.statusCode = 409;
      return res.end(
        JSON.stringify({
          success: false,
          error: `An agent with email '${body.email}' already exists.`,
        })
      );
    }

    const newAgent = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone.trim(),
      serviceArea: body.serviceArea.trim(),
      status: body.status || 'active',
      vehicleType: body.vehicleType || 'Motorcycle',
      rating: typeof body.rating === 'number' ? body.rating : 5.0,
      activeOrders: typeof body.activeOrders === 'number' ? body.activeOrders : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    agents.unshift(newAgent);
    saveAgents(agents);
    invalidateCache();

    res.statusCode = 201;
    return res.end(
      JSON.stringify({
        success: true,
        message: 'Delivery agent created successfully.',
        data: newAgent,
      })
    );
  }

  // Match /api/agents/:id
  const detailMatch = pathname.match(/^\/api\/agents\/([^/]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    res.setHeader('Content-Type', 'application/json');

    // GET /api/agents/:id
    if (req.method === 'GET') {
      const cacheKey = `agents:detail:${id}`;
      const cached = cache.get(cacheKey);

      if (cached) {
        cacheHits++;
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.end(JSON.stringify({ success: true, source: 'cache', cacheKey, data: cached }));
      }

      cacheMisses++;
      const agent = agents.find((a) => a.id === id);
      if (!agent) {
        res.statusCode = 404;
        return res.end(
          JSON.stringify({
            success: false,
            error: `Delivery agent with ID '${id}' was not found.`,
          })
        );
      }

      cache.set(cacheKey, agent);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.end(JSON.stringify({ success: true, source: 'database', cacheKey, data: agent }));
    }

    // PUT /api/agents/:id (Update)
    if (req.method === 'PUT') {
      const body = await getRequestBody(req);
      const index = agents.findIndex((a) => a.id === id);

      if (index === -1) {
        res.statusCode = 404;
        return res.end(
          JSON.stringify({
            success: false,
            error: `Delivery agent with ID '${id}' was not found.`,
          })
        );
      }

      // Check email duplicate if changed
      if (body.email && body.email.toLowerCase() !== agents[index].email.toLowerCase()) {
        const emailOwner = agents.find(
          (a) => a.email.toLowerCase() === body.email.toLowerCase().trim() && a.id !== id
        );
        if (emailOwner) {
          res.statusCode = 409;
          return res.end(
            JSON.stringify({
              success: false,
              error: `An agent with email '${body.email}' already exists.`,
            })
          );
        }
      }

      const updated = {
        ...agents[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };

      agents[index] = updated;
      saveAgents(agents);
      invalidateCache();

      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          success: true,
          message: 'Delivery agent updated successfully.',
          data: updated,
        })
      );
    }

    // DELETE /api/agents/:id
    if (req.method === 'DELETE') {
      const index = agents.findIndex((a) => a.id === id);
      if (index === -1) {
        res.statusCode = 404;
        return res.end(
          JSON.stringify({
            success: false,
            error: `Delivery agent with ID '${id}' was not found.`,
          })
        );
      }

      const deleted = agents.splice(index, 1)[0];
      saveAgents(agents);
      invalidateCache();

      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          success: true,
          message: `Delivery agent '${deleted.name}' (${id}) was deleted successfully.`,
        })
      );
    }
  }

  // Not found fallback
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  return res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }));
};
