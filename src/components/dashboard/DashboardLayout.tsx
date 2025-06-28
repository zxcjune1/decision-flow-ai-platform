
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useDashboards } from '@/hooks/useDashboards';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Settings, 
  Search, 
  Bell,
  LogOut
} from 'lucide-react';
import DashboardGrid from './DashboardGrid';
import DashboardWidgets from './DashboardWidgets';
import NewDashboardDialog from './NewDashboardDialog';
import AddWidgetDialog from './AddWidgetDialog';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { dashboards, currentDashboard, widgets, loading, setCurrentDashboard } = useDashboards();
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Business Intelligence</h1>
        </div>
        
        {/* Dashboard List */}
        {dashboards.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Dashboards</h3>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{dashboards.length}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => setCurrentDashboard(dashboard)}
                  className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                    currentDashboard?.id === dashboard.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {dashboard.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'dashboard' && currentDashboard 
                  ? currentDashboard.name 
                  : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              {activeTab === 'dashboard' && currentDashboard?.description && (
                <span className="text-sm text-gray-500">
                  {currentDashboard.description}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  className="pl-10 w-64"
                />
              </div>
              <NewDashboardDialog />
              {activeTab === 'dashboard' && currentDashboard && (
                <AddWidgetDialog />
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {currentDashboard ? (
                <DashboardWidgets widgets={widgets} />
              ) : (
                <div className="text-center py-12">
                  <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No dashboards yet</h3>
                  <p className="mt-2 text-gray-500">Create your first dashboard to get started.</p>
                  <div className="mt-4">
                    <NewDashboardDialog />
                  </div>
                </div>
              )}
              
              {/* Sample KPI Overview when dashboard exists */}
              {currentDashboard && <DashboardGrid />}
            </div>
          )}
          
          {activeTab === 'datasets' && (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No datasets yet</h3>
              <p className="mt-2 text-gray-500">Upload your first CSV, JSON, or Excel file to get started.</p>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No reports yet</h3>
              <p className="mt-2 text-gray-500">Create your first report from your datasets.</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Input value={user?.email || ''} disabled className="mt-1" />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
