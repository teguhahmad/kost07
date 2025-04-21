import React, { useState } from 'react';
import { Payment, Tenant, Room } from '../../types';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface PaymentFormProps {
  payment?: Payment;
  tenants: Tenant[];
  rooms: Room[];
  onSubmit: (data: Partial<Payment>) => void;
  onClose: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  payment, 
  tenants,
  rooms,
  onSubmit, 
  onClose 
}) => {
  const [formData, setFormData] = React.useState<Partial<Payment>>({
    tenantId: payment?.tenantId || '',
    roomId: payment?.roomId || '',
    amount: payment?.amount || 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: payment?.dueDate || '',
    status: 'paid',
    paymentMethod: 'transfer',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'tenantId') {
      const tenant = tenants.find(t => t.id === value);
      setFormData(prev => ({ 
        ...prev, 
        tenantId: value,
        roomId: tenant?.roomId || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filter active tenants
  const activeTenants = tenants.filter(tenant => tenant.status === 'active');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Catat Pembayaran
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penyewa
            </label>
            <select
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih penyewa</option>
              {activeTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} - Kamar {tenant.roomId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pembayaran
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jatuh Tempo
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="transfer">Transfer Bank</option>
              <option value="cash">Tunai</option>
              <option value="card">Kartu Kredit/Debit</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tambahkan catatan jika diperlukan..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="success">
              Konfirmasi Pembayaran
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;