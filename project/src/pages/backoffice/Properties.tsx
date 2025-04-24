import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { Building2, Search, Users, DoorClosed, CreditCard, Loader2, TrendingUp, Eye } from 'lucide-react';
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

const BackofficeProperties: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyStats, setPropertyStats] = useState<Record<string, PropertyStats>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          owner:auth.users!properties_owner_id_fkey (
            email,
            user_metadata
          )
        `)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Transform properties data
      const transformedProperties = propertiesData?.map(property => ({
        ...property,
        owner_email: property.owner?.email,
        owner_name: property.owner?.user_metadata?.name || property.owner?.email
      })) || [];

      setProperties(transformedProperties);

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

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                        onClick={() => setShowPropertyDetails(property.id)}
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

      {/* Property Details Modal - To be implemented */}
      {showPropertyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <p className="text-gray-500">Detailed property view to be implemented</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowPropertyDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackofficeProperties;