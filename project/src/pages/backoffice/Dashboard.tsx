import React, { useState, useEffect } from 'react';
import { Users, Building2, CreditCard, TrendingUp, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
  total_users: number;
  total_properties: number;
  total_revenue: number;
  active_tenants: number;
  monthly_revenue: any[];
  user_growth: any[];
  property_distribution: { city: string; count: number }[];
  recent_activities: {
    id: string;
    type: string;
    description: string;
    created_at: string;
  }[];
  new_users: {
    last_24h: number;
    last_3d: number;
    last_7d: number;
    last_14d: number;
    last_21d: number;
    last_30d: number;
    last_year: number;
  };
}

const BackofficeDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_properties: 0,
    total_revenue: 0,
    active_tenants: 0,
    monthly_revenue: [],
    user_growth: [],
    property_distribution: [],
    recent_activities: [],
    new_users: {
      last_24h: 0,
      last_3d: 0,
      last_7d: 0,
      last_14d: 0,
      last_21d: 0,
      last_30d: 0,
      last_year: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedUserPeriod, setSelectedUserPeriod] = useState<keyof DashboardStats['new_users']>('last_24h');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get total users
      const { count: usersCount } = await supabase
        .from('backoffice_users')
        .select('*', { count: 'exact', head: true });

      // Get new users for different time periods
      const now = new Date();
      const periods = {
        last_24h: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        last_3d: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        last_7d: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        last_14d: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        last_21d: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
        last_30d: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        last_year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      };

      const newUsersStats = {} as DashboardStats['new_users'];
      
      for (const [period, date] of Object.entries(periods)) {
        const { count } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString());

        newUsersStats[period as keyof DashboardStats['new_users']] = count || 0;
      }

      // Get total properties
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Get total revenue
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'paid')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Get monthly revenue data
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleString('default', { month: 'short' });
        const revenue = revenueData?.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        }).reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        return { month, revenue };
      }).reverse();

      // Get active tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get property distribution by city
      const { data: propertyDistribution } = await supabase
        .from('properties')
        .select('city')
        .order('city');

      const cityCount = propertyDistribution?.reduce((acc, property) => {
        acc[property.city] = (acc[property.city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const distribution = Object.entries(cityCount || {}).map(([city, count]) => ({
        city,
        count
      }));

      // Get recent activities from audit logs
      const { data: activities } = await supabase
        .from('backoffice_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user growth data
      const userGrowthData = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const { count } = await supabase
            .from('auth.users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfMonth.toISOString());

          return {
            month: date.toLocaleString('default', { month: 'short' }),
            users: count || 0
          };
        })
      );

      setStats({
        total_users: usersCount || 0,
        total_properties: propertiesCount || 0,
        total_revenue: totalRevenue,
        active_tenants: tenantsCount || 0,
        monthly_revenue: monthlyRevenue,
        user_growth: userGrowthData.reverse(),
        property_distribution: distribution,
        recent_activities: activities || [],
        new_users: newUsersStats
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'last_24h': return '24 Hours';
      case 'last_3d': return '3 Days';
      case 'last_7d': return '1 Week';
      case 'last_14d': return '2 Weeks';
      case 'last_21d': return '3 Weeks';
      case 'last_30d': return '1 Month';
      case 'last_year': return '1 Year';
      default: return period;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users.toString()}
          icon={<Users size={24} />}
          change={{ value: "+5", type: "increase" }}
        />
        <StatCard
          title="Total Properties"
          value={stats.total_properties.toString()}
          icon={<Building2 size={24} />}
          change={{ value: "+2", type: "increase" }}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={<CreditCard size={24} />}
          change={{ value: "+12%", type: "increase" }}
        />
        <StatCard
          title="Active Tenants"
          value={stats.active_tenants.toString()}
          icon={<TrendingUp size={24} />}
          change={{ value: "+8", type: "increase" }}
        />
      </div>

      {/* New Users Statistics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">New Users</h2>
            <div className="flex gap-2">
              {(Object.keys(stats.new_users) as Array<keyof DashboardStats['new_users']>).map((period) => (
                <Button
                  key={period}
                  variant={selectedUserPeriod === period ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedUserPeriod(period)}
                >
                  {getPeriodLabel(period)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600 font-medium">New Users in Last {getPeriodLabel(selectedUserPeriod)}</p>
                <p className="text-3xl font-bold text-blue-900">{stats.new_users[selectedUserPeriod]}</p>
              </div>
              <Users size={48} className="text-blue-500 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">Monthly Revenue</h2>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">User Growth</h2>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.user_growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Property Distribution Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">Property Distribution by City</h2>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.property_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="city" type="category" width={100} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recent_activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeDashboard;