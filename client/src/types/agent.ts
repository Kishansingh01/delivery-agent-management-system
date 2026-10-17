export type AgentStatus = 'active' | 'inactive' | 'on_delivery';
export type VehicleType = 'Bicycle' | 'Motorcycle' | 'Car' | 'Van';

export interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  status: AgentStatus;
  vehicleType: VehicleType;
  rating: number;
  activeOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AgentListResponse {
  success: boolean;
  source: 'cache' | 'database';
  cacheKey: string;
  data: DeliveryAgent[];
  pagination: AgentPagination;
  responseTimeMs?: number;
}

export interface AgentDetailResponse {
  success: boolean;
  source: 'cache' | 'database';
  cacheKey: string;
  data: DeliveryAgent;
  responseTimeMs?: number;
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  onDeliveryAgents: number;
  totalActiveOrders: number;
  averageRating: number;
  serviceAreas: string[];
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRatio: string;
  lastInvalidatedAt: string | null;
  mode: 'real' | 'mock';
}

export interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  status: AgentStatus;
  vehicleType: VehicleType;
  rating: number;
  activeOrders: number;
}
