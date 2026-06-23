-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert profiles"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow authenticated users to update profiles"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- ----------------------------------------------------
-- BETS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Allow authenticated users to view all bets"
ON public.bets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert bets"
ON public.bets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- ----------------------------------------------------
-- RESULTS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Allow authenticated users to view results"
ON public.results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert results"
ON public.results FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- ----------------------------------------------------
-- AUDIT LOGS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Allow authenticated users to view audit logs"
ON public.audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);
