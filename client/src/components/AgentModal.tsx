import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Truck, Star, AlertCircle } from 'lucide-react';
import { DeliveryAgent, AgentFormData, AgentStatus, VehicleType } from '../types/agent';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => Promise<void>;
  agent?: DeliveryAgent | null;
  serviceAreas: string[];
}

const defaultAreas = [
  'Downtown Financial',
  'Uptown Arts District',
  'Metro West Valley',
  'North Bay Harbor',
  'South Hills Heights',
  'Eastside Tech Hub',
];

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agent,
  serviceAreas,
}) => {
  const isEditing = !!agent;

  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    phone: '',
    serviceArea: 'Downtown Financial',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 5.0,
    activeOrders: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        serviceArea: agent.serviceArea,
        status: agent.status,
        vehicleType: agent.vehicleType,
        rating: agent.rating,
        activeOrders: agent.activeOrders,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceArea: serviceAreas[0] || 'Downtown Financial',
        status: 'active',
        vehicleType: 'Motorcycle',
        rating: 5.0,
        activeOrders: 0,
      });
    }
    setError(null);
  }, [agent, isOpen, serviceAreas]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const allAreas = Array.from(new Set([...defaultAreas, ...serviceAreas]));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 className="modal-title">{isEditing ? 'Edit Delivery Agent' : 'Create New Delivery Agent'}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isEditing ? `Updating ID: ${agent.id}` : 'Fill in the agent details below'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fda4af',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group form-full">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex.m@swiftfleet.io"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 234-5678"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Area *</label>
                <input
                  list="service-areas-datalist"
                  required
                  placeholder="Select or enter area..."
                  className="form-input"
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                />
                <datalist id="service-areas-datalist">
                  {allAreas.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AgentStatus })}
                >
                  <option value="active">Active</option>
                  <option value="on_delivery">On Delivery</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-select"
                  value={formData.vehicleType}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleType: e.target.value as VehicleType })
                  }
                >
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Active Orders</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="form-input"
                  value={formData.activeOrders}
                  onChange={(e) =>
                    setFormData({ ...formData, activeOrders: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Agent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
