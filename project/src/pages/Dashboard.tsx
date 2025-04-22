import React from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  ClipboardList, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import OccupancyChart from '../components/dashboard/OccupancyChart';
import RoomOverview from '../components/dashboard/RoomOverview';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import MaintenanceOverview from '../components/dashboard/MaintenanceOverview';
import { formatCurrency } from '../utils/formatters';
import { 
  tenants, 
  rooms, 
  payments, 
  maintenanceRequests, 
  getFinancialSummary, 
  getOccupancySummary 
} from '../data/mockData';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const financialSummary = getFinancialSummary();
  const occupancySummary = getOccupancySummary();

  const pendingPayments = payments.filter(
    payment => payment.status === 'pending' || payment.status === 'overdue'
  );

  const activeMaintenanceRequests = maintenanceRequests.filter(
    request => request.status === 'pending' || request.status === 'in-progress'
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Beranda</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Penyewa"
          value={tenants.filter(tenant => tenant.status === 'active').length}
          icon={<Users size={24} />}
          change={{ value: "+2", type: "increase" }}
        />
        <StatCard
          title="Total Kamar"
          value={rooms.length}
          icon={<Building2 size={24} />}
          change={{ value: "0", type: "neutral" }}
        />
        <StatCard
          title="Pendapatan Bulanan"
          value={formatCurrency(financialSummary.monthlyIncome)}
          icon={<CreditCard size={24} />}
          change={{ value: "+5%", type: "increase" }}
        />
        <StatCard
          title="Permintaan Pemeliharaan"
          value={activeMaintenanceRequests.length}
          icon={<ClipboardList size={24} />}
          change={{ value: "-1", type: "decrease" }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart data={occupancySummary} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard
            title="Tingkat Hunian"
            value={`${occupancySummary.occupancyRate}%`}
            icon={<TrendingUp size={24} />}
            change={{ value: "+2.5%", type: "increase" }}
            className="h-full"
          />
          <StatCard
            title="Pembayaran Terlambat"
            value={formatCurrency(financialSummary.overduePayments)}
            icon={<AlertTriangle size={24} />}
            change={{ value: formatCurrency(financialSummary.overduePayments), type: "increase" }}
            className="h-full"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPayments 
          payments={pendingPayments} 
          tenants={tenants}
          onViewAllClick={() => onNavigate('payments')}
        />
        <MaintenanceOverview 
          maintenanceRequests={activeMaintenanceRequests} 
          rooms={rooms}
          onViewAllClick={() => onNavigate('maintenance')}
        />
      </div>
      
      <RoomOverview 
        rooms={rooms} 
        onViewAllClick={() => onNavigate('rooms')}
      />
    </div>
  );
};

export default Dashboard;