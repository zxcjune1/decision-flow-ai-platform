
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Table, 
  Activity, 
  Map, 
  MoreVertical,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDashboards } from '@/hooks/useDashboards';
import { Tables } from '@/integrations/supabase/types';

type DashboardWidget = Tables<'dashboard_widgets'>;

const widgetIcons = {
  chart: BarChart3,
  table: Table,
  kpi: Activity,
  map: Map
};

interface DashboardWidgetsProps {
  widgets: DashboardWidget[];
}

export default function DashboardWidgets({ widgets }: DashboardWidgetsProps) {
  const { deleteWidget } = useDashboards();

  const handleDeleteWidget = async (widgetId: string) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      await deleteWidget(widgetId);
    }
  };

  if (widgets.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No widgets yet</h3>
        <p className="mt-2 text-gray-500">Add your first widget to start visualizing your data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {widgets.map((widget) => {
        const IconComponent = widgetIcons[widget.widget_type as keyof typeof widgetIcons] || Activity;
        
        return (
          <Card key={widget.id} className="relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-medium">
                  {widget.title}
                </CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs">
                  {widget.widget_type.toUpperCase()}
                </Badge>
                <CardDescription className="text-xs">
                  Created {new Date(widget.created_at!).toLocaleDateString()}
                </CardDescription>
                
                {/* Placeholder content based on widget type */}
                <div className="mt-4 h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <IconComponent className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Widget Preview</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
