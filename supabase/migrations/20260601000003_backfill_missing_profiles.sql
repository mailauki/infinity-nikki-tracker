INSERT INTO public.profiles (id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
