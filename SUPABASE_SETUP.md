# Supabase setup

1. Create a Supabase project and run [`supabase_schema.sql`](./supabase_schema.sql) in the SQL editor.
2. Copy `.env.example` to `.env` and fill in the project URL and anon key from **Project Settings > API**.
3. Register the account that should become the first administrator, then run:

   ```sql
   update public.profiles
   set role = 'admin', status = 'approved'
   where email = 'your-admin@example.com';
   ```

4. In **Authentication > URL Configuration**, set the Site URL to the deployed site and add its GitHub Pages URL to the redirect allow list, for example:

   ```text
   https://OWNER.github.io/REPOSITORY/
   ```

5. For GitHub Pages, add repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. In **Settings > Pages**, select **GitHub Actions** as the source.
6. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The anon key is designed to be present in the browser bundle. Access control is enforced by the RLS policies in the schema. Never put a Supabase service-role key in a Vite environment variable or GitHub Pages build.
