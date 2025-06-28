
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create datasets table for storing uploaded data files
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'json', 'excel')),
  file_size BIGINT,
  file_path TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'processing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboards table
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard widgets table
CREATE TABLE public.dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('chart', 'table', 'kpi', 'map')),
  title TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  position JSONB DEFAULT '{}',
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets" ON public.datasets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own datasets" ON public.datasets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets" ON public.datasets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets" ON public.datasets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dashboards
CREATE POLICY "Users can view their own dashboards or public ones" ON public.dashboards
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create their own dashboards" ON public.dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" ON public.dashboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" ON public.dashboards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dashboard widgets
CREATE POLICY "Users can view widgets of accessible dashboards" ON public.dashboard_widgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_id 
      AND (d.user_id = auth.uid() OR d.is_public = TRUE)
    )
  );

CREATE POLICY "Users can manage widgets of their own dashboards" ON public.dashboard_widgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_id 
      AND d.user_id = auth.uid()
    )
  );

-- Create storage bucket for datasets
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false);

-- Storage policy for datasets
CREATE POLICY "Users can upload their own datasets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'datasets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own datasets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'datasets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
