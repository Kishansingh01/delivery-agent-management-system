import React, { useState } from 'react';
import { X, Zap, RefreshCw, Trash2, Server, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CacheMetrics } from '../types/agent';
import { purgeCache } from '../services/api';

interface CacheInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CacheMetrics | null;
  onRefreshMetrics: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CacheInspectorModal: React.FC<CacheInspectorModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onRefreshMetrics,
  onShowToast,
}) => {
  const [purging, setPurging] = useState(false);

  if (!isOpen) return null;

  const handlePurge = async () => {
    setPurging(true);
    try {
      await purgeCache();
      onRefreshMetrics();
      onShowToast('Redis cache keys cleared successfully', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to clear cache', 'error');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 className="modal-title">Redis Caching Engine & Metrics</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Live cache telemetry and invalidation strategy
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Server size={18} color="#6366f1" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Redis Engine Mode: {metrics?.mode === 'real' ? 'Production Redis' : 'In-Memory Fallback'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {metrics?.mode === 'real'
                    ? 'Connected to redis://localhost:6379'
                    : 'Auto-fallback enabled (Zero external dependencies needed for review)'}
                </div>
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: metrics?.mode === 'real' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: metrics?.mode === 'real' ? '#34d399' : '#818cf8',
                border: '1px solid currentColor',
              }}
            >
              {metrics?.mode === 'real' ? 'REAL REDIS' : 'MOCK REDIS'}
            </span>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: 'rgba(10, 13, 20, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                CACHE HITS
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-display)' }}>
                {metrics?.hits ?? 0}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(10, 13, 20, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                CACHE MISSES
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
                {metrics?.misses ?? 0}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(10, 13, 20, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                HIT RATIO
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
                {metrics?.hitRatio ?? '0%'}
              </div>
            </div>
          </div>

          {/* Caching Strategy Explanation */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 600, color: '#c7d2fe', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#818cf8" />
              <span>How Consistency & Invalidation Works:</span>
            </div>
            <ul style={{ paddingLeft: 18, listStyleType: 'disc' }}>
              <li>
                <strong>List Cache:</strong> Keys are parameterized by filters (e.g. <code>agents:list:limit=10&page=1</code>).
              </li>
              <li>
                <strong>Detail Cache:</strong> Keys are mapped by UUID (e.g. <code>agents:detail:{'{id}'}</code>).
              </li>
              <li>
                <strong>Invalidation on Write:</strong> When an agent is created, updated, or deleted, all affected list queries, detail keys, and dashboard metrics are automatically evicted so data remains strictly consistent.
              </li>
              <li>
                <strong>TTL Expiration:</strong> Default 300 seconds TTL ensures automatic background freshness.
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefreshMetrics}
          >
            <RefreshCw size={14} />
            Refresh Telemetry
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={handlePurge}
              disabled={purging}
            >
              <Trash2 size={14} />
              {purging ? 'Purging...' : 'Flush Redis Cache'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
