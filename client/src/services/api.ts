import {
  AgentListResponse,
  AgentDetailResponse,
  DashboardStats,
  CacheMetrics,
  AgentFormData,
  DeliveryAgent,
} from '../types/agent';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api/agents`;

// Initial fallback mock data for demo / standalone Vercel preview
const initialMockAgents: DeliveryAgent[] = [
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let memoryAgents: DeliveryAgent[] = [...initialMockAgents];
const memoryCache = new Map<string, any>();
let cacheHits = 0;
let cacheMisses = 0;

export async function fetchAgents(params: {
  search?: string;
  status?: string;
  serviceArea?: string;
  vehicleType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<AgentListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.serviceArea) query.set('serviceArea', params.serviceArea);
  if (params.vehicleType) query.set('vehicleType', params.vehicleType);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const startTime = performance.now();
  try {
    const res = await fetch(`${API_BASE}?${query.toString()}`);
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch delivery agents');
    }

    const data = await res.json();
    return {
      ...data,
      responseTimeMs,
    };
  } catch (err) {
    // Graceful offline / standalone Vercel preview fallback
    const cacheKey = `agents:list:${query.toString() || 'all'}`;
    const cached = memoryCache.get(cacheKey);

    if (cached) {
      cacheHits++;
      return {
        success: true,
        source: 'cache',
        cacheKey,
        data: cached.data,
        pagination: cached.pagination,
        responseTimeMs: 2,
      };
    }

    cacheMisses++;
    let filtered = [...memoryAgents];
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.phone.toLowerCase().includes(s) ||
          a.serviceArea.toLowerCase().includes(s)
      );
    }
    if (params.status) filtered = filtered.filter((a) => a.status === params.status);
    if (params.serviceArea) filtered = filtered.filter((a) => a.serviceArea === params.serviceArea);
    if (params.vehicleType) filtered = filtered.filter((a) => a.vehicleType === params.vehicleType);

    const page = params.page || 1;
    const limit = params.limit || 8;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const result = {
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

    memoryCache.set(cacheKey, result);
    return {
      success: true,
      source: 'database',
      cacheKey,
      ...result,
      responseTimeMs: 18,
    };
  }
}

export async function fetchAgentById(id: string): Promise<AgentDetailResponse> {
  const startTime = performance.now();
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch agent details');
    }

    const data = await res.json();
    return {
      ...data,
      responseTimeMs,
    };
  } catch (err) {
    const cacheKey = `agents:detail:${id}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      cacheHits++;
      return {
        success: true,
        source: 'cache',
        cacheKey,
        data: cached,
        responseTimeMs: 2,
      };
    }

    cacheMisses++;
    const found = memoryAgents.find((a) => a.id === id);
    if (!found) throw new Error(`Agent with ID '${id}' not found`);

    memoryCache.set(cacheKey, found);
    return {
      success: true,
      source: 'database',
      cacheKey,
      data: found,
      responseTimeMs: 16,
    };
  }
}

export async function createAgent(formData: AgentFormData): Promise<DeliveryAgent> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.details && data.details.length) {
        const messages = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        throw new Error(messages);
      }
      throw new Error(data.error || 'Failed to create agent');
    }

    return data.data;
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) throw err;

    // Fallback handler
    const newAgent: DeliveryAgent = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryAgents.unshift(newAgent);
    memoryCache.clear(); // invalidate
    return newAgent;
  }
}

export async function updateAgent(
  id: string,
  formData: Partial<AgentFormData>
): Promise<DeliveryAgent> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.details && data.details.length) {
        const messages = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        throw new Error(messages);
      }
      throw new Error(data.error || 'Failed to update agent');
    }

    return data.data;
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) throw err;

    const idx = memoryAgents.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Agent not found');
    memoryAgents[idx] = {
      ...memoryAgents[idx],
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    memoryCache.clear();
    return memoryAgents[idx];
  }
}

export async function deleteAgent(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete agent');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) throw err;
    memoryAgents = memoryAgents.filter((a) => a.id !== id);
    memoryCache.clear();
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/meta/stats`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch stats');
    }
    return data.data;
  } catch (err) {
    const total = memoryAgents.length;
    const active = memoryAgents.filter((a) => a.status === 'active').length;
    const inactive = memoryAgents.filter((a) => a.status === 'inactive').length;
    const onDelivery = memoryAgents.filter((a) => a.status === 'on_delivery').length;
    const activeOrders = memoryAgents.reduce((sum, a) => sum + a.activeOrders, 0);
    const avgRating = total
      ? Number((memoryAgents.reduce((s, a) => s + a.rating, 0) / total).toFixed(2))
      : 5.0;
    const serviceAreas = Array.from(new Set(memoryAgents.map((a) => a.serviceArea))).sort();

    return {
      totalAgents: total,
      activeAgents: active,
      inactiveAgents: inactive,
      onDeliveryAgents: onDelivery,
      totalActiveOrders: activeOrders,
      averageRating: avgRating,
      serviceAreas,
    };
  }
}

export async function fetchCacheMetrics(): Promise<CacheMetrics> {
  try {
    const res = await fetch(`${API_BASE}/meta/cache-status`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch cache status');
    }
    return data.data;
  } catch (err) {
    const total = cacheHits + cacheMisses;
    return {
      hits: cacheHits,
      misses: cacheMisses,
      totalRequests: total,
      hitRatio: total > 0 ? `${((cacheHits / total) * 100).toFixed(1)}%` : '0%',
      lastInvalidatedAt: new Date().toISOString(),
      mode: 'mock',
    };
  }
}

export async function purgeCache(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/meta/cache-clear`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to purge cache');
    }
  } catch (err) {
    memoryCache.clear();
  }
}
