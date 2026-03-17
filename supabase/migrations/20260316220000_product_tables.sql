-- ─────────────────────────────────────────────
-- food_logs
-- ─────────────────────────────────────────────
CREATE TABLE public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal TEXT NOT NULL DEFAULT 'breakfast',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'g',
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own food logs" ON public.food_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- workout_logs
-- ─────────────────────────────────────────────
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'strength',
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  exercises JSONB,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout logs" ON public.workout_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- goals
-- ─────────────────────────────────────────────
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  target NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  starting_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'decrease',
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- lifestyle_logs
-- ─────────────────────────────────────────────
CREATE TABLE public.lifestyle_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC NOT NULL DEFAULT 0,
  sleep_quality INTEGER NOT NULL DEFAULT 3,
  mood INTEGER NOT NULL DEFAULT 3,
  stress INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_date)
);
ALTER TABLE public.lifestyle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lifestyle logs" ON public.lifestyle_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- water_logs
-- ─────────────────────────────────────────────
CREATE TABLE public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own water logs" ON public.water_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- meal_plans
-- ─────────────────────────────────────────────
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meal plans" ON public.meal_plans USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- fasting_sessions
-- ─────────────────────────────────────────────
CREATE TABLE public.fasting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL DEFAULT '16:8',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  target_hours NUMERIC NOT NULL DEFAULT 16,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fasting sessions" ON public.fasting_sessions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- steps_logs
-- ─────────────────────────────────────────────
CREATE TABLE public.steps_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  steps INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 10000,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_date)
);
ALTER TABLE public.steps_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own steps logs" ON public.steps_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Enable realtime on key tables
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.steps_logs;
