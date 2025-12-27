# Running Migrations in Supabase

Since migrations need to be run in the Supabase SQL Editor, follow these steps:

## Steps

1. **Go to Supabase Dashboard**
   - Open your Supabase project at https://supabase.com/dashboard
   - Navigate to your LocalSquares project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run First Migration**
   - Copy the entire contents of `backend/migrations/001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for it to complete (should see "Success. No rows returned")

4. **Run Second Migration**
   - Copy the entire contents of `backend/migrations/002_rls_policies.sql`
   - Paste into a new query in SQL Editor
   - Click "Run"
   - Wait for it to complete

5. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - users
     - boards
     - pins
     - pin_slots
     - impressions
     - clicks
     - payments
     - reports

## If You Get Errors

- **"relation already exists"**: Tables might already exist, that's okay
- **"permission denied"**: Make sure you're running as the database owner
- **Other errors**: Check the error message and make sure you're using the correct Supabase project

