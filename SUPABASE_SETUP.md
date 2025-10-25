# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `techrise-profile-app`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
6. Click "Create new project"

## 2. Get Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - Project URL
   - Anon (public) key

## 3. Update Environment Variables

Update the following files with your Supabase credentials:

### `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL_HERE',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  },
};
```

### `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_SUPABASE_URL_HERE',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  },
};
```

## 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-schema.sql`
5. Click "Run" to execute the SQL

This will create:

- `user_profiles` table with proper relationships
- Storage bucket for avatar images
- Row Level Security (RLS) policies
- Automatic profile creation on user signup
- Updated timestamp triggers

## 5. Configure Authentication

1. Go to "Authentication" in your Supabase dashboard
2. Click on "Settings" tab
3. Configure the following:

### Email Settings

- Enable email confirmations (optional for this demo)
- Set up email templates if needed

### URL Configuration

- Site URL: `http://localhost:4200` (for development)
- Redirect URLs: Add `http://localhost:4200/**` for development

## 6. Storage Configuration

1. Go to "Storage" in your Supabase dashboard
2. Verify that the `avatars` bucket was created
3. If not created, create it manually:
   - Click "New bucket"
   - Name: `avatars`
   - Make it public: Yes

## 7. Test the Setup

1. Start your Angular development server:

   ```bash
   npm start
   ```

2. Navigate to `http://localhost:4200`

3. Try to register a new user:
   - Fill out the registration form
   - Complete the verification step (mocked)
   - Check if the user appears in Supabase Auth
   - Check if the profile was created in the `user_profiles` table

## 8. Production Deployment

For production deployment:

1. Update environment variables with production Supabase credentials
2. Update Site URL and Redirect URLs in Supabase dashboard
3. Configure proper CORS settings
4. Set up proper email templates for authentication

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your domain is added to the allowed origins in Supabase
2. **RLS Policy Errors**: Ensure the user is authenticated and policies are correctly set up
3. **Storage Upload Errors**: Check that the avatars bucket exists and has proper policies
4. **Profile Creation Errors**: Verify the trigger function is working correctly

### Debug Steps

1. Check Supabase logs in the dashboard
2. Use browser developer tools to inspect network requests
3. Verify environment variables are correctly set
4. Test database queries directly in the SQL editor

## Security Notes

- Never commit your Supabase credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your Supabase usage and set up alerts
- Review and test your RLS policies thoroughly
