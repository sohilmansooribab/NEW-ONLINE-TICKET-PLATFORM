import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toast } = useBooking();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle size={20} color="#DC2626" />;
      case 'warning':
        return <AlertCircle size={20} color="#D97706" />;
      default:
        return <CheckCircle2 size={20} color="#059669" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderLeft: `4px solid ${toast.type === 'error' ? '#DC2626' : toast.type === 'warning' ? '#D97706' : '#059669'}`,
      padding: '14px 20px',
      borderRadius: '10px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
      color: '#171923',
      fontSize: '0.92rem',
      fontWeight: '600',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {getIcon()}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
