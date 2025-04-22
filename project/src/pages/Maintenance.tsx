import React, { useState } from 'react';
import { format } from 'date-fns';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';
import { maintenanceRequests as initialRequests, rooms, tenants } from '../data/mockData';
import { getMaintenancePriorityColor, getMaintenanceStatusColor } from '../utils/formatters';
import { Plus, Search, Filter, ArrowDownUp, PenTool as Tool, Clock, AlertTriangle } from 'lucide-react';
import { MaintenanceRequest } from '../types';

const Maintenance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | undefined>();
  const [requests, setRequests] = useState(initialRequests);

  // Find room and tenant data for each request
  const enhancedRequests = requests.map(request => {
    const room = rooms.find(r => r.id === request.roomId);
    const tenant = request.tenantId ? tenants.find(t => t.id === request.tenantId) : null;
    
    return {
      ...request,
      roomNumber: room ? room.number : 'Tidak Diketahui',
      tenantName: tenant ? tenant.name : null
    };
  });

  // Filter requests based on search query, status, and priority
  const filteredRequests = enhancedRequests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.roomNumber.includes(searchQuery) ||
      (request.tenantName && request.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddRequest = () => {
    setSelectedRequest(undefined);
    setShowForm(true);
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowForm(true);
  };

  const handleFormSubmit = (data: Partial<MaintenanceRequest>) => {
    if (selectedRequest) {
      // Update existing request
      setRequests(requests.map(request =>
        request.id === selectedRequest.id ? { ...request, ...data } : request
      ));
    } else {
      // Add new request
      const newRequest: MaintenanceRequest = {
        id: Math.random().toString(36).substr(2, 9),
        ...data as Omit<MaintenanceRequest, 'id'>
      };
      setRequests([...requests, newRequest]);
    }
    setShowForm(false);
    setSelectedRequest(undefined);
  };

  const handleUpdateStatus = (request: MaintenanceRequest, newStatus: 'pending' | 'in-progress' | 'completed') => {
    setRequests(requests.map(r =>
      r.id === request.id ? { ...r, status: newStatus } : r
    ));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pemeliharaan</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Permintaan Aktif</p>
                <p className="mt-1 text-2xl font-semibold text-blue-900">
                  {enhancedRequests.filter(r => r.status !== 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full text-blue-600">
                <Tool size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Menunggu Review</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-900">
                  {enhancedRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full text-yellow-600">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Prioritas Tinggi</p>
                <p className="mt-1 text-2xl font-semibold text-red-900">
                  {enhancedRequests.filter(r => r.priority === 'high' && r.status !== 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-full text-red-600">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Permintaan Pemeliharaan</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari permintaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <Button icon={<Plus size={16} />} onClick={handleAddRequest}>
              Permintaan Baru
            </Button>
          </div>
        </CardHeader>

        <div className="px-6 pb-2 flex flex-wrap justify-between">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === 'all' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('all')}
            >
              Semua Status
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('pending')}
            >
              Menunggu
            </Button>
            <Button 
              variant={statusFilter === 'in-progress' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('in-progress')}
            >
              Dalam Proses
            </Button>
            <Button 
              variant={statusFilter === 'completed' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('completed')}
            >
              Selesai
            </Button>
          </div>
          
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button 
              variant={priorityFilter === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setPriorityFilter('all')}
            >
              Semua Prioritas
            </Button>
            <Button 
              variant={priorityFilter === 'high' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setPriorityFilter('high')}
            >
              Tinggi
            </Button>
            <Button 
              variant={priorityFilter === 'medium' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setPriorityFilter('medium')}
            >
              Sedang
            </Button>
            <Button 
              variant={priorityFilter === 'low' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setPriorityFilter('low')}
            >
              Rendah
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                    <p className="text-sm text-gray-500">Kamar {request.roomNumber}</p>
                    {request.tenantName && (
                      <p className="text-sm text-gray-500">Dilaporkan oleh: {request.tenantName}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getMaintenancePriorityColor(request.priority)}>
                      Prioritas {request.priority === 'high' ? 'Tinggi' : 
                               request.priority === 'medium' ? 'Sedang' : 'Rendah'}
                    </Badge>
                    <Badge className={getMaintenanceStatusColor(request.status)}>
                      {request.status === 'pending' ? 'Menunggu' : 
                       request.status === 'in-progress' ? 'Dalam Proses' : 'Selesai'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{request.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Dilaporkan pada {format(new Date(request.date), 'd MMMM yyyy')}
                  </span>
                  <div className="flex gap-2">
                    {request.status !== 'completed' && (
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleUpdateStatus(request, 'in-progress')}
                          >
                            Mulai Pengerjaan
                          </Button>
                        )}
                        {request.status === 'in-progress' && (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleUpdateStatus(request, 'completed')}
                          >
                            Selesai
                          </Button>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRequest(request)}
                    >
                      Ubah Permintaan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <MaintenanceForm
          request={selectedRequest}
          rooms={rooms}
          tenants={tenants}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setSelectedRequest(undefined);
          }}
        />
      )}
    </div>
  );
};

export default Maintenance;