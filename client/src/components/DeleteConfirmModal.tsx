import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  agentName: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  agentName,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className="modal-title">Delete Delivery Agent</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Are you sure you want to delete delivery agent <strong style={{ color: '#fff' }}>{agentName}</strong>?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 10 }}>
            This action will delete the persistent record from the database and automatically invalidate all related Redis caches.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Confirm Deletion'}
          </button>
        </div>
      </div>
    </div>
  );
};
