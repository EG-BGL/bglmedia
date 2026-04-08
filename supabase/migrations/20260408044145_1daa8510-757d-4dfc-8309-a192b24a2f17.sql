
DROP POLICY "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid());
