import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  Star,
  Clock,
  Zap,
  Database,
  Copy,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import { fetchAgentById } from '../services/api';
import { AgentDetailResponse } from '../types/agent';

interface AgentDetailModalProps {
  agentId: string | null;
  onClose: () => void;
  onEdit: (agent: any) => void;
  onDelete: (id: string, name: string) => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agentId,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [detailResponse, setDetailResponse] = useState<AgentDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAgentById(id);
      setDetailResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      loadAgent(agentId);
    } else {
      setDetailResponse(null);
    }
  }, [agentId]);

  if (!agentId) return null;

  const agent = detailResponse?.data;

  const handleCopyId = () => {
    if (agent?.id) {
      navigator.clipboard.writeText(agent.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'badge-active';
      case 'on_delivery':
        return 'badge-on_delivery';
      default:
        return 'badge-inactive';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#fff',
              }}
            >
              {agent?.name ? agent.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div>
              <h3 className="modal-title">{agent?.name || 'Loading Agent...'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className="agent-id-tag">ID: {agentId}</span>
                <button
                  onClick={handleCopyId}
                  title="Copy Agent ID"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fetching agent record...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#fda4af' }}>
              <p>{error}</p>
            </div>
          ) : agent ? (
            <>
              {/* Cache Inspection Indicator Card */}
              <div
                style={{
                  background: 'rgba(10, 13, 20, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {detailResponse?.source === 'cache' ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#6ee7b7',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                      }}
                    >
                      <Zap size={16} color="#10b981" />
                      <span>SERVED FROM REDIS CACHE</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#fcd34d',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                      }}
                    >
                      <Database size={16} color="#f59e0b" />
                      <span>FETCHED FROM PERSISTENT DB</span>
                    </div>
                  )}
                  <span
                    className={
                      detailResponse?.source === 'cache' ? 'cache-pill-hit' : 'cache-pill-miss'
                    }
                  >
                    {detailResponse?.source === 'cache' ? 'CACHE HIT' : 'CACHE MISS'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Latency: <strong style={{ color: '#fff' }}>{detailResponse?.responseTimeMs}ms</strong></span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => loadAgent(agent.id)}
                    title="Reload from API to test cache"
                    style={{ padding: '4px 8px' }}
                  >
                    Test Cache Hit
                  </button>
                </div>
              </div>

              {/* Agent Information Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    STATUS
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(agent.status)}`}>
                    <span className="status-dot dot-green" />
                    {agent.status.replace('_', ' ')}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    SERVICE AREA
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc', fontWeight: 600 }}>
                    <MapPin size={16} />
                    <span>{agent.serviceArea}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    EMAIL ADDRESS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    <Mail size={16} color="#6366f1" />
                    <span style={{ wordBreak: 'break-all' }}>{agent.email}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    PHONE NUMBER
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    <Phone size={16} color="#10b981" />
                    <span>{agent.phone}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    VEHICLE & FLEET
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={16} color="#06b6d4" />
                    <span>{agent.vehicleType}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    RATING & ORDERS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                      <Star size={15} fill="#f59e0b" />
                      <strong>{agent.rating}</strong>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {agent.activeOrders} active order{agent.activeOrders === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  <span>Created: {new Date(agent.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  <span>Last Updated: {new Date(agent.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {agent && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  onClose();
                  onDelete(agent.id, agent.name);
                }}
              >
                <Trash2 size={15} />
                Delete Agent
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {agent && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(agent);
                }}
              >
                <Edit2 size={15} />
                Edit Details
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
