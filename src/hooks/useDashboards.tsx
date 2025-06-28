
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Dashboard = Tables<'dashboards'>;
type DashboardWidget = Tables<'dashboard_widgets'>;
type NewDashboard = TablesInsert<'dashboards'>;
type NewWidget = TablesInsert<'dashboard_widgets'>;

export function useDashboards() {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's dashboards
  const fetchDashboards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
      
      // Set first dashboard as current if none selected
      if (!currentDashboard && data && data.length > 0) {
        setCurrentDashboard(data[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      toast.error('Failed to load dashboards');
    }
  };

  // Fetch widgets for current dashboard
  const fetchWidgets = async () => {
    if (!currentDashboard) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', currentDashboard.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWidgets(data || []);
    } catch (error) {
      console.error('Error fetching widgets:', error);
      toast.error('Failed to load widgets');
    }
  };

  // Create new dashboard
  const createDashboard = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const newDashboard: NewDashboard = {
        user_id: user.id,
        name,
        description,
        layout: [],
        is_public: false
      };

      const { data, error } = await supabase
        .from('dashboards')
        .insert(newDashboard)
        .select()
        .single();

      if (error) throw error;

      setDashboards(prev => [data, ...prev]);
      setCurrentDashboard(data);
      toast.success('Dashboard created successfully');
      return data;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
      return null;
    }
  };

  // Add widget to current dashboard
  const addWidget = async (widgetData: Omit<NewWidget, 'dashboard_id'>) => {
    if (!currentDashboard) return null;

    try {
      const newWidget: NewWidget = {
        ...widgetData,
        dashboard_id: currentDashboard.id
      };

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert(newWidget)
        .select()
        .single();

      if (error) throw error;

      setWidgets(prev => [...prev, data]);
      toast.success('Widget added successfully');
      return data;
    } catch (error) {
      console.error('Error adding widget:', error);
      toast.error('Failed to add widget');
      return null;
    }
  };

  // Delete widget
  const deleteWidget = async (widgetId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.success('Widget deleted successfully');
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('Failed to delete widget');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to dashboard changes
    const dashboardChannel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboards',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Dashboard change:', payload);
          fetchDashboards();
        }
      )
      .subscribe();

    // Subscribe to widget changes
    const widgetChannel = supabase
      .channel('widget-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_widgets'
        },
        (payload) => {
          console.log('Widget change:', payload);
          if (currentDashboard) {
            fetchWidgets();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dashboardChannel);
      supabase.removeChannel(widgetChannel);
    };
  }, [user, currentDashboard]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboards();
    }
    setLoading(false);
  }, [user]);

  // Fetch widgets when current dashboard changes
  useEffect(() => {
    if (currentDashboard) {
      fetchWidgets();
    }
  }, [currentDashboard]);

  return {
    dashboards,
    currentDashboard,
    widgets,
    loading,
    setCurrentDashboard,
    createDashboard,
    addWidget,
    deleteWidget,
    fetchDashboards,
    fetchWidgets
  };
}
