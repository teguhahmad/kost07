import React from 'react';
import { Users, Building2, CreditCard, Home } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import { BackofficeStats } from '../../types/backoffice';

const mockStats: BackofficeStats = {
  total_users: 150,
  total_properties: 25,
  total_revenue: 75000000,
  active_tenants: 120
};

const BackofficeDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Backoffice</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pengguna"
          value={mockStats.total_users.toString()}
          icon={<Users size={24} />}
          change={{ value: "+5", type: "increase" }}
        />
        <StatCard
          title="Total Properti"
          value={mockStats.total_properties.toString()}
          icon={<Building2 size={24} />}
          change={{ value: "+2", type: "increase" }}
        />
        <StatCard
          title="Total Pendapatan"
          value={new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(mockStats.total_revenue)}
          icon={<CreditCard size={24} />}
          change={{ value: "+12%", type: "increase" }}
        />
        <StatCard
          title="Penyewa Aktif"
          value={mockStats.active_tenants.toString()}
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