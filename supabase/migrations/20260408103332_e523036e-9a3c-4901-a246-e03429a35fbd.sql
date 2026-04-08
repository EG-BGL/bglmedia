INSERT INTO public.user_roles (user_id, role)
VALUES ('ce71dc50-c8bf-4b77-8e28-5f5e94fb6afa', 'coach')
ON CONFLICT (user_id, role) DO NOTHING;