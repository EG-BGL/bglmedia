
-- 1. Fix: Coaches can self-approve results (tighten WITH CHECK on update policy)
DROP POLICY IF EXISTS "Coaches can update own draft results" ON public.results;

CREATE POLICY "Coaches can update own draft results"
ON public.results
FOR UPDATE
TO authenticated
USING (
  submitted_by = auth.uid()
  AND status = ANY(ARRAY['draft'::result_status, 'submitted'::result_status])
  AND EXISTS (SELECT 1 FROM fixtures f WHERE f.id = results.fixture_id AND f.is_locked = false)
)
WITH CHECK (
  submitted_by = auth.uid()
  AND status = ANY(ARRAY['draft'::result_status, 'submitted'::result_status])
);

-- 2. Fix: Users can escalate their own role via profile update
-- Replace the permissive update policy with one that prevents role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND (role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 3. Fix: Remove overly permissive scorecard upload policy
DROP POLICY IF EXISTS "Authenticated users can upload scorecard images" ON storage.objects;

-- 4. Fix: Audit logs - remove client INSERT, add server-side trigger
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

-- Create trigger function for automatic audit logging on results changes
CREATE OR REPLACE FUNCTION public.audit_results_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, action, record_id, performed_by, new_data)
    VALUES ('results', 'INSERT', NEW.id, auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, action, record_id, performed_by, old_data, new_data)
    VALUES ('results', 'UPDATE', NEW.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, action, record_id, performed_by, old_data)
    VALUES ('results', 'DELETE', OLD.id, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach trigger to results table
DROP TRIGGER IF EXISTS audit_results_trigger ON public.results;
CREATE TRIGGER audit_results_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.audit_results_changes();
