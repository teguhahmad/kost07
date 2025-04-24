import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { Building2, Search, Users, DoorClosed, CreditCard, Loader2, TrendingUp, Eye, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PropertyStats {
  id: string;
  total_revenue: number;
  total_tenants: number;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  pending_payments: number;
}

interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  owner_id: string;
  owner_email?: string;
  owner_name?: string;
  stats?: PropertyStats;
  tenants?: any[];
  rooms?: any[];
  payments?: any[];
}

const BackofficeProperties: React.FC = () => {
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [propertyStats, setPropertyStats] = useState<Record<string, PropertyStats>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetails | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get all properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Then get owner details for each property from auth.users
      const propertiesWithOwners = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: ownerData } = await supabase
            .auth.admin.getUserById(property.owner_id);

          return {
            ...property,
            owner_email: ownerData?.user?.email,
            owner_name: ownerData?.user?.user_metadata?.name || ownerData?.user?.email
          };
        })
      );

      setProperties(propertiesWithOwners);

      // Load stats for each property
      const stats: Record<string, PropertyStats> = {};
      
      for (const property of propertiesData || []) {
        // Get rooms stats
        const { data: rooms } = await supabase
          .from('rooms')
          .select('*')
          .eq('property_id', property.id);

        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Get tenants count
        const { count: tenantsCount } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'active');

        // Get revenue stats
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('property_id', property.id)
          .eq('status', 'paid');

        const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        // Get pending payments
        const { data: pendingPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('property_id', property.id)
          .in('status', ['pending', 'overdue']);

        const pendingAmount = pendingPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        stats[property.id] = {
          id: property.id,
          total_revenue: totalRevenue,
          total_tenants: tenantsCount || 0,
          total_rooms: totalRooms,
          occupied_rooms: occupiedRooms,
          occupancy_rate: occupancyRate,
          pending_payments: pendingAmount
        };
      }

      setPropertyStats(stats);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPropertyDetails = async (propertyId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Get owner details
      const { data: ownerData } = await supabase
        .auth.admin.getUserById(property.owner_id);

      // Get rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId);

      if (roomsError) throw roomsError;

      // Get tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('property_id', propertyId);

      if (tenantsError) throw tenantsError;

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const propertyDetails: PropertyDetails = {
        ...property,
        owner_email: ownerData?.user?.email,
        owner_name: ownerData?.user?.user_metadata?.name || ownerData?.user?.email,
        stats: propertyStats[propertyId],
        rooms,
        tenants,
        payments
      };

      setSelectedProperty(propertyDetails);
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Failed to load property details');
      setSelectedProperty(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = async (propertyId: string) => {
    setShowPropertyDetails(propertyId);
    await loadPropertyDetails(propertyId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">All Properties</h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Loading properties...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                        <p className="text-sm text-gray-500">{property.city}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {propertyStats[property.id]?.occupancy_rate.toFixed(0)}% Occupied
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <CreditCard size={16} />
                          Revenue
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(propertyStats[property.id]?.total_revenue || 0)}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Users size={16} />
                          Tenants
                        </div>
                        <p className="font-semibold text-gray-900">
                          {propertyStats[property.id]?.total_tenants || 0} Active
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <DoorClosed size={16} />
                          Rooms
                        </div>
                        <p className="font-semibold text-gray-900">
                          {propertyStats[property.id]?.occupied_rooms || 0}/{propertyStats[property.id]?.total_rooms || 0}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <TrendingUp size={16} />
                          Pending
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(propertyStats[property.id]?.pending_payments || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Owner</span>
                        <span className="font-medium text-gray-900">
                          {property.owner_name || property.owner_email}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        icon={<Eye size={16} />}
                        onClick={() => handleViewDetails(property.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchQuery
                ? 'No properties match your search.'
                : 'No properties found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Modal */}
      {showPropertyDetails && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedProperty.name}</h2>
              <button 
                onClick={() => {
                  setShowPropertyDetails(null);
                  setSelectedProperty(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Property Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedProperty.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{selectedProperty.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{selectedProperty.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{selectedProperty.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{selectedProperty.owner_name}</p>
                    <p className="text-sm text-gray-500">{selectedProperty.owner_email}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Revenue</p>
                    <p className="text-xl font-semibold text-blue-900">
                      {formatCurrency(selectedProperty.stats?.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Active Tenants</p>
                    <p className="text-xl font-semibold text-green-900">
                      {selectedProperty.stats?.total_tenants || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Occupancy Rate</p>
                    <p className="text-xl font-semibold text-yellow-900">
                      {selectedProperty.stats?.occupancy_rate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Pending Payments</p>
                    <p className="text-xl font-semibold text-red-900">
                      {formatCurrency(selectedProperty.stats?.pending_payments || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rooms Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Rooms Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProperty.rooms?.map((room) => (
                        <tr key={room.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{room.number}</td>
                          <td className="px-6 py-4 whitespace-nowrap capitalize">{room.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{room.floor}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(room.price)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={
                              room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                              room.status === 'vacant' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {room.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Payments */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProperty.payments?.slice(0, 5).map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap capitalize">
                            {payment.payment_method || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackofficeProperties;