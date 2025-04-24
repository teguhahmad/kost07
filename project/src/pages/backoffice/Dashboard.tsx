import React, { useState, useEffect } from 'react';
import { Users, Building2, CreditCard, Home } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import { BackofficeStats } from '../../types/backoffice';
import { supabase } from '../../lib/supabase';

const BackofficeDashboard: React.FC = () => {
  const [stats, setStats] = useState<BackofficeStats>({
    total_users: 0,
    total_properties: 0,
    total_revenue: 0,
    active_tenants: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get total users
      const { count: usersCount } = await supabase
        .from('backoffice_users')
        .select('*', { count: 'exact', head: true });

      // Get total properties
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Get total revenue (sum of all paid payments)
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid');
      
      const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Get active tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        total_users: usersCount || 0,
        total_properties: propertiesCount || 0,
        total_revenue: totalRevenue,
        active_tenants: tenantsCount || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Backoffice</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pengguna"
          value={stats.total_users.toString()}
          icon={<Users size={24} />}
          change={{ value: "+5", type: "increase" }}
        />
        <StatCard
          title="Total Properti"
          value={stats.total_properties.toString()}
          icon={<Building2 size={24} />}
          change={{ value: "+2", type: "increase" }}
        />
        <StatCard
          title="Total Pendapatan"
          value={new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(stats.total_revenue)}
          icon={<CreditCard size={24} />}
          change={{ value: "+12%", type: "increase" }}
        />
        <StatCard
          title="Penyewa Aktif"
          value={stats.active_tenants.toString()}
          icon={<Home size={24} />}
          change={{ value: "+8", type: "increase" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">Aktivitas Terbaru</h2>
          </CardHeader>
          <CardContent>
            {/* Activity list will be implemented later */}
            <p className="text-gray-500">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">Statistik Sistem</h2>
          </CardHeader>
          <CardContent>
            {/* System statistics will be implemented later */}
            <p className="text-gray-500">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackofficeDashboard;