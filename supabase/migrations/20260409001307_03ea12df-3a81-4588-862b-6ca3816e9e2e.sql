
-- Drop the overly permissive insert policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Replace with a restrictive policy - only admins can manually insert
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'league_admin'::app_role));
