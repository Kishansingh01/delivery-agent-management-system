import {
  AgentListResponse,
  AgentDetailResponse,
  DashboardStats,
  CacheMetrics,
  AgentFormData,
  DeliveryAgent,
} from '../types/agent';

const API_BASE = '/api/agents';

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
  const res = await fetch(`${API_BASE}?${query.toString()}`);
  const endTime = performance.now();
  const responseTimeMs = Math.round(endTime - startTime);

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch delivery agents');
  }

  return {
    ...data,
    responseTimeMs,
  };
}

export async function fetchAgentById(id: string): Promise<AgentDetailResponse> {
  const startTime = performance.now();
  const res = await fetch(`${API_BASE}/${id}`);
  const endTime = performance.now();
  const responseTimeMs = Math.round(endTime - startTime);

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch agent details');
  }

  return {
    ...data,
    responseTimeMs,
  };
}

export async function createAgent(formData: AgentFormData): Promise<DeliveryAgent> {
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
}

export async function updateAgent(
  id: string,
  formData: Partial<AgentFormData>
): Promise<DeliveryAgent> {
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
}

export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete agent');
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/meta/stats`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }
  return data.data;
}

export async function fetchCacheMetrics(): Promise<CacheMetrics> {
  const res = await fetch(`${API_BASE}/meta/cache-status`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch cache status');
  }
  return data.data;
}

export async function purgeCache(): Promise<void> {
  const res = await fetch(`${API_BASE}/meta/cache-clear`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to purge cache');
  }
}
