import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Bell, Search, Plus, Trash, Loader2, X, CheckCircle, AlertTriangle, Clock, Settings, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface NotificationFormData {
  title: string;
  message: string;
  type: 'system' | 'user' | 'property' | 'payment';
  target: 'all' | 'new' | 'specific' | 'property';
  target_user_ids?: string[];
  target_property_id?: string;
}

const BackofficeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'system',
    target: 'all'
  });

  useEffect(() => {
    loadNotifications();
    loadUsers();
    loadProperties();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name');
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      let notifications = [];

      switch (formData.target) {
        case 'all':
          // System-wide notification
          notifications.push({
            ...formData,
            type: 'system',
            target_user_id: null,
            target_property_id: null
          });
          break;

        case 'new':
          // Get users created in the last 24 hours
          const { data: newUsers } = await supabase
            .from('auth.users')
            .select('id')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
          
          notifications = (newUsers || []).map(user => ({
            ...formData,
            target_user_id: user.id,
            target_property_id: null
          }));
          break;

        case 'specific':
          // Create notification for each selected user
          notifications = (formData.target_user_ids || []).map(userId => ({
            ...formData,
            target_user_id: userId,
            target_property_id: null
          }));
          break;

        case 'property':
          // Property-specific notification
          notifications.push({
            ...formData,
            target_user_id: null,
            target_property_id: formData.target_property_id
          });
          break;
      }

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        type: 'system',
        target: 'all'
      });
      await loadNotifications();
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Failed to create notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = (id: string) => {
    setSelectedNotification(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedNotification) {
      try {
        setIsLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', selectedNotification);

        if (deleteError) throw deleteError;
        await loadNotifications();
        setShowDeleteConfirm(false);
        setSelectedNotification(null);
      } catch (err) {
        console.error('Error deleting notification:', err);
        setError('Failed to delete notification');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || notification.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Settings className="text-blue-500" />;
      case 'user':
        return <Bell className="text-green-500" />;
      case 'property':
        return <Clock className="text-yellow-500" />;
      case 'payment':
        return <AlertTriangle className="text-red-500" />;
      default:
        return <Bell className="text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'property':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
        <Button 
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
          disabled={isLoading}
        >
          Buat Notifikasi
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Notifikasi</h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari notifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </CardHeader>

        <div className="px-6 pb-4 flex flex-wrap gap-2">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Semua
          </Button>
          <Button 
            variant={filter === 'system' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('system')}
          >
            Sistem
          </Button>
          <Button 
            variant={filter === 'user' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('user')}
          >
            Pengguna
          </Button>
          <Button 
            variant={filter === 'property' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('property')}
          >
            Properti
          </Button>
          <Button 
            variant={filter === 'payment' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('payment')}
          >
            Pembayaran
          </Button>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        </div>
                        <Badge className={getNotificationTypeColor(notification.type)}>
                          {notification.type === 'system' ? 'Sistem' :
                           notification.type === 'user' ? 'Pengguna' :
                           notification.type === 'property' ? 'Properti' : 'Pembayaran'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm')}
                        </span>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={isLoading}
                          icon={<Trash size={14} />}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {searchQuery
                ? 'Tidak ada notifikasi yang sesuai dengan pencarian Anda.'
                : 'Belum ada notifikasi.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Buat Notifikasi Baru</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    title: '',
                    message: '',
                    type: 'system',
                    target: 'all'
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Penerima
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target: e.target.value as 'all' | 'new' | 'specific' | 'property'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="all">Semua Pengguna</option>
                  <option value="new">Pengguna Baru (24 jam terakhir)</option>
                  <option value="specific">Pengguna Tertentu</option>
                  <option value="property">Properti Tertentu</option>
                </select>
              </div>

              {formData.target === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Pengguna
                  </label>
                  <select
                    multiple
                    value={formData.target_user_ids || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData(prev => ({ ...prev, target_user_ids: values }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Tahan Ctrl/Cmd untuk memilih beberapa pengguna
                  </p>
                </div>
              )}

              {formData.target === 'property' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Properti
                  </label>
                  <select
                    value={formData.target_property_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      target_property_id: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih properti...</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'system' | 'user' | 'property' | 'payment'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="system">Sistem</option>
                  <option value="user">Pengguna</option>
                  <option value="property">Properti</option>
                  <option value="payment">Pembayaran</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      title: '',
                      message: '',
                      type: 'system',
                      target: 'all'
                    });
                  }}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  icon={isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Konfirmasi Penghapusan
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedNotification(null);
                }}
              >
                Batal
              </Button>
              <Button 
                variant="danger"
                onClick={confirmDelete}
                icon={<Trash size={16} />}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackofficeNotifications;