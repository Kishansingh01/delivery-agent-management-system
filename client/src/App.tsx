import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Zap,
  Filter,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Truck,
  Star,
  Activity,
  Layers,
  CheckCircle,
  Database,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  DeliveryAgent,
  AgentPagination,
  DashboardStats,
  CacheMetrics,
  AgentFormData,
} from './types/agent';
import {
  fetchAgents,
  fetchStats,
  fetchCacheMetrics,
  createAgent,
  updateAgent,
  deleteAgent,
} from './services/api';
import { AgentModal } from './components/AgentModal';
import { AgentDetailModal } from './components/AgentDetailModal';
import { CacheInspectorModal } from './components/CacheInspectorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function App() {
  // Agent list state
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [pagination, setPagination] = useState<AgentPagination>({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Telemetry & metrics state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [lastQuerySource, setLastQuerySource] = useState<'cache' | 'database'>('database');
  const [lastQueryLatency, setLastQueryLatency] = useState<number>(0);
  const [lastQueryKey, setLastQueryKey] = useState<string>('');

  // Modals state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [deletingAgentInfo, setDeletingAgentInfo] = useState<{ id: string; name: string } | null>(
    null
  );

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const loadStatsAndCache = async () => {
    try {
      const [s, c] = await Promise.all([fetchStats(), fetchCacheMetrics()]);
      setStats(s);
      setCacheMetrics(c);
    } catch (err) {
      console.warn('Failed to refresh stats/cache:', err);
    }
  };

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAgents({
        search,
        status: statusFilter,
        serviceArea: serviceAreaFilter,
        vehicleType: vehicleFilter,
        page: currentPage,
        limit: 8,
      });

      setAgents(res.data);
      setPagination(res.pagination);
      setLastQuerySource(res.source);
      setLastQueryLatency(res.responseTimeMs || 0);
      setLastQueryKey(res.cacheKey);

      // Refresh background telemetry
      loadStatsAndCache();
    } catch (err: any) {
      showToast(err.message || 'Error loading delivery agents', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, serviceAreaFilter, vehicleFilter, currentPage]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateOrUpdate = async (formData: AgentFormData) => {
    if (editingAgent) {
      await updateAgent(editingAgent.id, formData);
      showToast(`Agent '${formData.name}' updated successfully`, 'success');
    } else {
      await createAgent(formData);
      showToast(`Delivery agent '${formData.name}' created successfully`, 'success');
    }
    loadAgents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAgentInfo) return;
    try {
      await deleteAgent(deletingAgentInfo.id);
      showToast(`Agent '${deletingAgentInfo.name}' deleted successfully`, 'success');
      loadAgents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete agent', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="status-badge badge-active">
            <span className="status-dot dot-green" />
            Active
          </span>
        );
      case 'on_delivery':
        return (
          <span className="status-badge badge-on_delivery">
            <span className="status-dot dot-cyan" />
            On Delivery
          </span>
        );
      default:
        return (
          <span className="status-badge badge-inactive">
            <span className="status-dot dot-amber" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <CheckCircle size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title">SwiftDispatch Fleet</h1>
            <p className="brand-subtitle">
              Delivery Agent Management & Low-Latency Redis Caching Architecture
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setIsCacheModalOpen(true)}>
            <Zap size={16} color="#06b6d4" />
            Cache Inspector
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingAgent(null);
              setIsAgentModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Delivery Agent
          </button>
        </div>
      </header>

      {/* System Status & Cache Banner */}
      <div className="system-status-banner">
        <div className="system-status-left">
          <div className="status-pill">
            <span className="status-dot dot-green" />
            <span>Storage: <strong>SQLite (Prisma ORM)</strong></span>
          </div>

          <div className="status-pill">
            <span className={`status-dot ${cacheMetrics?.mode === 'real' ? 'dot-green' : 'dot-cyan'}`} />
            <span>
              Redis: <strong>{cacheMetrics?.mode === 'real' ? 'Production Redis' : 'In-Memory Mock'}</strong>
            </span>
          </div>

          <div className="status-pill">
            <Zap size={14} color="#06b6d4" />
            <span>Hit Ratio: <strong>{cacheMetrics?.hitRatio || '0%'}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Latest Query:</span>
            <span className={lastQuerySource === 'cache' ? 'cache-pill-hit' : 'cache-pill-miss'}>
              {lastQuerySource === 'cache' ? 'REDIS HIT' : 'DB MISS'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ({lastQueryLatency}ms)
            </span>
          </div>
          <button
            className="btn-icon"
            onClick={loadAgents}
            title="Reload API Query (will trigger Cache Hit on repeated call)"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Agents</span>
            <div className="stat-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalAgents ?? '—'}</div>
          <div className="stat-footer">Registered in fleet database</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active / Ready</span>
            <div className="stat-icon" style={{ color: '#10b981' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {stats?.activeAgents ?? '—'}
          </div>
          <div className="stat-footer">Available for order assignment</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">On Delivery</span>
            <div className="stat-icon" style={{ color: '#06b6d4' }}>
              <Truck size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {stats?.onDeliveryAgents ?? '—'}
          </div>
          <div className="stat-footer">{stats?.totalActiveOrders ?? 0} deliveries in transit</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Fleet Avg Rating</span>
            <div className="stat-icon" style={{ color: '#f59e0b' }}>
              <Star size={18} fill="#f59e0b" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {stats?.averageRating ? `${stats.averageRating}★` : '5.0★'}
          </div>
          <div className="stat-footer">Across {stats?.serviceAreas.length ?? 0} delivery zones</div>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, phone, or area..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="on_delivery">On Delivery</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="select-control"
            value={serviceAreaFilter}
            onChange={(e) => {
              setServiceAreaFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Service Areas</option>
            {stats?.serviceAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            className="select-control"
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Vehicles</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Bicycle">Bicycle</option>
            <option value="Car">Car</option>
            <option value="Van">Van</option>
          </select>

          {(search || statusFilter || serviceAreaFilter || vehicleFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setServiceAreaFilter('');
                setVehicleFilter('');
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Agent Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="agent-table">
            <thead>
              <tr>
                <th>Agent Profile</th>
                <th>Contact Info</th>
                <th>Service Area</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Rating & Orders</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && agents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px 0' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading fleet agents...</p>
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Users size={38} className="empty-state-icon" />
                      <h3>No delivery agents found</h3>
                      <p style={{ marginTop: 6, fontSize: '0.85rem' }}>
                        Try clearing search filters or create a new delivery agent.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <div className="agent-name-cell">
                        <div className="agent-avatar">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="agent-name-text">{agent.name}</div>
                          <div className="agent-id-tag">{agent.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                        {agent.email}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {agent.phone}
                      </div>
                    </td>

                    <td>
                      <span className="area-badge">
                        <MapPin size={12} />
                        {agent.serviceArea}
                      </span>
                    </td>

                    <td>
                      <span className="vehicle-badge">
                        <Truck size={14} color="#06b6d4" />
                        {agent.vehicleType}
                      </span>
                    </td>

                    <td>{getStatusBadge(agent.status)}</td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b' }}>
                          <Star size={13} fill="#f59e0b" />
                          <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{agent.rating}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          ({agent.activeOrders} active)
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          title="View Agent Details & Cache Telemetry"
                          onClick={() => setSelectedAgentId(agent.id)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Edit Agent"
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsAgentModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete Agent"
                          onClick={() => setDeletingAgentInfo({ id: agent.id, name: agent.name })}
                          style={{ color: '#fda4af' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing <strong style={{ color: '#fff' }}>{agents.length}</strong> of{' '}
            <strong style={{ color: '#fff' }}>{pagination.total}</strong> delivery agents
            {lastQueryKey && (
              <span
                style={{
                  marginLeft: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Key: {lastQueryKey}
              </span>
            )}
          </div>

          <div className="pagination-controls">
            <button
              className="btn btn-secondary btn-sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ArrowLeft size={14} />
              Previous
            </button>
            <span style={{ fontSize: '0.825rem', padding: '0 8px' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setEditingAgent(null);
        }}
        onSubmit={handleCreateOrUpdate}
        agent={editingAgent}
        serviceAreas={stats?.serviceAreas || []}
      />

      <AgentDetailModal
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
        onEdit={(agent) => {
          setEditingAgent(agent);
          setIsAgentModalOpen(true);
        }}
        onDelete={(id, name) => setDeletingAgentInfo({ id, name })}
      />

      <CacheInspectorModal
        isOpen={isCacheModalOpen}
        onClose={() => setIsCacheModalOpen(false)}
        metrics={cacheMetrics}
        onRefreshMetrics={loadStatsAndCache}
        onShowToast={showToast}
      />

      <DeleteConfirmModal
        isOpen={!!deletingAgentInfo}
        onClose={() => setDeletingAgentInfo(null)}
        onConfirm={handleDeleteConfirm}
        agentName={deletingAgentInfo?.name || ''}
      />
    </div>
  );
}
export default App;
