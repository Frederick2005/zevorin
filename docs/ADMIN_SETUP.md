# Administrator setup

Public sign-up never grants admin. To create the first admin:

1. Sign up normally on the site with the account that should be admin.
2. Supabase Dashboard → Authentication → Users → copy that user's **UID**.
3. Supabase Dashboard → SQL Editor, run (replace the UUID):

   ```sql
   select public.grant_admin('00000000-0000-0000-0000-000000000000');
   ```

To remove an admin, run in the SQL editor:
`delete from public.user_roles where user_id = '<uid>' and role = 'admin';`
The `grant_admin` function cannot be called from the browser or the public API.
