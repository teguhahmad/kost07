import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Bell, Search, Plus, Trash, Loader2, X, CheckCircle, AlertTriangle, Clock, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface NotificationFormData {
  title: string;
  message: string;
  type: 'system' | 'user' | 'property' | 'payment';
}

const BackofficeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'system'
  });

  useEffect(() => {
    loadNotifications();

    // Subscribe to notifications changes
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('notifications')
        .insert([{
          ...formData,
          status: 'unread'
        }]);

      if (insertError) throw insertError;

      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        type: 'system'
      });
      await loadNotifications();
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Failed to create notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await loadNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || notification.type === filter;
    
    return matchesSearch && matchesFilter;
  });

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

  // Get notification stats
  const stats = {
    total: notifications.length,
    system: notifications.filter(n => n.type === 'system').length,
    user: notifications.filter(n => n.type === 'user').length,
    property: notifications.filter(n => n.type === 'property').length,
    payment: notifications.filter(n => n.type === 'payment').length
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifikasi</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-white rounded-full">
                <Bell size={24} className="text-gray-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Sistem</p>
                <p className="mt-1 text-2xl font-semibold text-blue-900">{stats.system}</p>
              </div>
              <div className="p-3 bg-white rounded-full">
                <Settings size={24} className="text-blue-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Pengguna</p>
                <p className="mt-1 text-2xl font-semibold text-green-900">{stats.user}</p>
              </div>
              <div className="p-3 bg-white rounded-full">
                <Bell size={24} className="text-green-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Properti</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-900">{stats.property}</p>
              </div>
              <div className="p-3 bg-white rounded-full">
                <Clock size={24} className="text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Pembayaran</p>
                <p className="mt-1 text-2xl font-semibold text-red-900">{stats.payment}</p>
              </div>
              <div className="p-3 bg-white rounded-full">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

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
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
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
                    type: 'system'
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
                      type: 'system'
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
    </div>
  );
};

export default BackofficeNotifications;