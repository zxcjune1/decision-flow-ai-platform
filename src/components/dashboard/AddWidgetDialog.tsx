
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useDashboards } from '@/hooks/useDashboards';

const widgetTypes = [
  { value: 'chart', label: 'Chart', description: 'Bar, line, or pie chart' },
  { value: 'table', label: 'Table', description: 'Data table with sorting' },
  { value: 'kpi', label: 'KPI Card', description: 'Key performance indicator' },
  { value: 'map', label: 'Map', description: 'Geographic visualization' }
];

export default function AddWidgetDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [widgetType, setWidgetType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { addWidget, currentDashboard } = useDashboards();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !widgetType || !currentDashboard) return;

    setLoading(true);
    
    const defaultConfigs = {
      chart: { chartType: 'bar', data: [], colors: ['#3b82f6', '#10b981', '#f59e0b'] },
      table: { columns: [], data: [], pagination: true },
      kpi: { value: 0, target: 100, format: 'number', trend: 'up' },
      map: { center: [0, 0], zoom: 2, markers: [] }
    };

    const result = await addWidget({
      title: title.trim(),
      widget_type: widgetType,
      config: defaultConfigs[widgetType as keyof typeof defaultConfigs] || {},
      position: { x: 0, y: 0, w: 6, h: 4 },
      dataset_id: null
    });
    
    if (result) {
      setTitle('');
      setWidgetType('');
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Widget</DialogTitle>
            <DialogDescription>
              Add a new widget to your dashboard to visualize your data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                placeholder="Enter widget title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Widget Type</Label>
              <Select value={widgetType} onValueChange={setWidgetType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select widget type" />
                </SelectTrigger>
                <SelectContent>
                  {widgetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !widgetType}>
              {loading ? 'Adding...' : 'Add Widget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
