# Authentication Setup Guide

LocalSquares uses Supabase Auth for authentication, supporting both email (magic links) and phone (SMS) authentication methods.

## Authentication Methods

### 1. Email Authentication (Magic Links)

- User enters email address
- Supabase sends magic link to email
- User clicks link to sign in/sign up
- Seamless experience, no password needed

### 2. Phone Authentication (SMS)

- User enters phone number (with country code)
- Supabase sends verification code via SMS
- User enters code to verify
- Requires SMS provider (Twilio recommended)

## Setup Steps

### 1. Enable Authentication Providers in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Enable **Phone** provider (requires SMS configuration)

### 2. Configure Email Settings

1. Go to Authentication → Settings
2. Set **Site URL** to your frontend URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Configure **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**`
4. Customize email templates if desired

### 3. Configure Phone/SMS (Twilio)

1. **Sign up for Twilio** (if needed):
   - Go to [twilio.com](https://twilio.com)
   - Get Account SID and Auth Token
   - Get a phone number (or use test credentials for development)

2. **Configure in Supabase**:
   - Go to Authentication → Providers → Phone
   - Enable Phone provider
   - Enter Twilio credentials:
     - **Twilio Account SID**
     - **Twilio Auth Token**
     - **Twilio Phone Number**

3. **For Development/Testing**:
   - Use Twilio test credentials
   - Or use Supabase's test mode (if available)

### 4. User Profile Creation

When a user signs up via Supabase Auth:

1. A record is created in `auth.users` (managed by Supabase)
2. A trigger should create a corresponding record in `public.users` table
3. The user profile includes:
   - Basic info (email/phone)
   - Business information (name, etc.)
   - Role (merchant/admin)

**Note**: The current implementation creates/updates user profiles in the `users` table via the application code. For production, consider setting up a database trigger to auto-create user profiles on signup.

### 5. Database Trigger (Recommended)

Create a trigger to auto-create user profiles:

```sql
-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    'merchant'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Frontend Integration

### Using Auth Utilities

```typescript
import { signInWithEmail, getCurrentUserProfile, signOut } from '@/lib/auth'

// Sign in with email
await signInWithEmail('user@example.com')

// Get current user
const user = await getCurrentUserProfile()

// Sign out
await signOut()
```

### Using Auth Context

```typescript
import { useAuth } from '@/app/providers'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome, {user.business_name}!</div>
}
```

## Authentication Flow

### New User Signup

1. User clicks "Claim Your Pin"
2. User enters email or phone
3. User receives magic link or SMS code
4. User verifies and is signed in
5. User completes business info
6. User creates first pin

### Returning User Signin

1. User enters email or phone
2. User receives magic link or SMS code
3. User verifies and is signed in
4. User redirected to dashboard

## Security Considerations

- **Row-Level Security (RLS)**: All database tables have RLS enabled
- **Session Management**: Handled by Supabase Auth
- **Token Refresh**: Automatic via Supabase client
- **Phone Verification**: Required for merchants (can be enforced)

## Testing Authentication

### Email (Magic Links)

1. Use a real email address
2. Check email inbox for magic link
3. Click link to verify sign in

### Phone (SMS)

1. Use Twilio test credentials for development:
   - Phone: `+15005550006` (Twilio test number)
   - Code: `123456` (always works in test mode)
2. Or use real phone number with Twilio account

## Troubleshooting

**Magic link not received:**
- Check spam folder
- Verify Site URL is correct in Supabase settings
- Check Supabase logs for errors

**SMS not received:**
- Verify Twilio credentials are correct
- Check Twilio account has credits
- Verify phone number format includes country code (+1242...)

**User profile not created:**
- Check database trigger is set up
- Verify RLS policies allow inserts
- Check Supabase logs

