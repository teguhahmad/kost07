import { supabase } from '../lib/supabase';
import { Property, Room, Tenant, Payment, MaintenanceRequest, Notification } from '../types';

export const propertyService = {
  async getAll() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Property[];
  },

  async create(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert([{ 
        ...property,
        owner_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  async update(id: string, property: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...property, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const roomService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId)
      .order('number');
    if (error) throw error;
    return data as Room[];
  },

  async create(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  },

  async update(id: string, room: Partial<Room>) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ ...room, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const tenantService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tenant[];
  },

  async create(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tenants')
      .insert([tenant])
      .select()
      .single();
    if (error) throw error;
    return data as Tenant;
  },

  async update(id: string, tenant: Partial<Tenant>) {
    const { data, error } = await supabase
      .from('tenants')
      .update({ ...tenant, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tenant;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const paymentService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Payment[];
  },

  async create(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async update(id: string, payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .update({ ...payment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const maintenanceService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MaintenanceRequest[];
  },

  async create(request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([request])
      .select()
      .single();
    if (error) throw error;
    return data as MaintenanceRequest;
  },

  async update(id: string, request: Partial<MaintenanceRequest>) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ ...request, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MaintenanceRequest;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const notificationService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
      .eq('status', 'unread');

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async create(notification: Omit<Notification, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ ...notification, status: 'unread' }])
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  }
};