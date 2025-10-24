# TechRise User Profile App

A modern Angular application for user registration, authentication, and profile management with Supabase integration.

## Features

### 🔐 Authentication & Registration

- **User Registration**: Complete signup form with avatar upload, personal details, and country selection
- **Email/Phone Verification**: Mocked verification system with 6-digit OTP codes
- **Password Security**: Secure password handling with confirmation
- **Supabase Integration**: Full authentication flow with Supabase Auth

### 👤 User Profile Management

- **Profile Display**: Beautiful profile page showing all user information
- **Profile Editing**: Modal-based editing with restricted email/phone changes
- **Avatar Management**: Upload, preview, and delete profile pictures
- **Real-time Updates**: Reactive profile updates using Angular signals

### 🎨 Modern UI/UX

- **Responsive Design**: Mobile-first approach with desktop optimization
- **Material Design**: Angular Material components for consistent UI
- **Loading States**: Proper loading indicators and error handling
- **Form Validation**: Comprehensive client-side validation

### 🛡️ Security & Data Management

- **Row Level Security**: Supabase RLS policies for data protection
- **Authentication Guards**: Route protection for authenticated users
- **File Upload Security**: Secure avatar upload with size limits
- **Data Validation**: Server-side and client-side validation

## Tech Stack

- **Frontend**: Angular 20+ with standalone components
- **UI Library**: Angular Material
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Angular Signals
- **Styling**: CSS3 with responsive design
- **Type Safety**: TypeScript with strict mode

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # Route protection
│   │   └── services/
│   │       ├── auth.service.ts         # Authentication logic
│   │       ├── user.service.ts         # User profile operations
│   │       └── supabase.service.ts     # Supabase client
│   ├── features/
│   │   ├── sign-up/
│   │   │   ├── sign-up.ts             # Registration component
│   │   │   ├── sign-up.html           # Registration template
│   │   │   └── sign-up.css            # Registration styles
│   │   ├── verification/
│   │   │   ├── verification.ts         # OTP verification
│   │   │   ├── verification.html      # Verification template
│   │   │   └── verification.css        # Verification styles
│   │   └── profile/
│   │       ├── profile.ts             # Profile display
│   │       ├── profile.html           # Profile template
│   │       ├── profile.css            # Profile styles
│   │       └── edit-profile-modal/    # Profile editing modal
│   ├── layout/
│   │   └── navbar/                    # Navigation component
│   ├── shared/
│   │   └── models/
│   │       └── user.model.ts          # TypeScript interfaces
│   └── core/
│       └── utils/
│           └── constants.ts           # App constants
├── environments/
│   ├── environment.ts                 # Development config
│   └── environment.prod.ts           # Production config
└── styles.css                        # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 20+
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd techrise
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Follow the instructions in `SUPABASE_SETUP.md`
   - Update environment variables with your Supabase credentials

4. **Start development server**

   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:4200`

## Configuration

### Environment Variables

Update the following files with your Supabase credentials:

**src/environments/environment.ts**

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
};
```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Configure authentication settings
4. Set up storage bucket for avatars

See `SUPABASE_SETUP.md` for detailed instructions.

## Usage

### User Registration Flow

1. **Registration Form**

   - Fill out personal information
   - Upload profile picture (optional)
   - Select country from autocomplete
   - Create secure password

2. **Verification Step**

   - Enter 6-digit verification code
   - Resend code if needed (2-minute timer)
   - Mocked verification system

3. **Profile Access**
   - Automatic redirect to profile page
   - View all personal information
   - Edit profile through modal

### Profile Management

- **View Profile**: Complete user information display
- **Edit Profile**: Modal-based editing (email/phone restricted)
- **Avatar Management**: Upload, preview, delete profile pictures
- **Real-time Updates**: Changes reflect immediately

### Navigation

- **Unauthenticated**: Logo, About Us, Pricing, Sign In
- **Authenticated**: Logo, About Us, Pricing, User Menu
- **Mobile**: Hamburger menu with responsive navigation

## API Integration

### Supabase Services

- **Authentication**: User signup, signin, signout
- **User Profiles**: CRUD operations for profile data
- **File Storage**: Avatar upload and management
- **Real-time**: Auth state changes and profile updates

### Data Models

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  birth_date?: string;
  country?: string;
  website?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

## Security Features

- **Row Level Security**: Database-level access control
- **Authentication Guards**: Route protection
- **File Upload Limits**: 1MB maximum for avatars
- **Input Validation**: Client and server-side validation
- **Secure Storage**: Supabase storage with proper policies

## Responsive Design

### Desktop (1200px+)

- Two-column layout for registration
- Full navigation menu
- Large profile display
- Modal-based editing

### Tablet (768px - 1199px)

- Single-column layout
- Collapsible navigation
- Optimized profile layout

### Mobile (< 768px)

- Single-column layout
- Hamburger navigation
- Touch-friendly interfaces
- Optimized form inputs

## Development

### Available Scripts

```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Angular Material**: Consistent UI components

## Deployment

### Production Build

```bash
npm run build
```

### Environment Configuration

1. Update production environment variables
2. Configure Supabase for production
3. Set up proper CORS and security settings
4. Deploy to your preferred hosting platform

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify environment variables
2. **Authentication Errors**: Check RLS policies
3. **File Upload Issues**: Verify storage bucket configuration
4. **CORS Errors**: Update allowed origins in Supabase

### Debug Steps

1. Check browser console for errors
2. Verify Supabase dashboard logs
3. Test API endpoints directly
4. Validate environment configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Check the troubleshooting section
- Review Supabase documentation
- Open an issue in the repository

---

**Built with ❤️ using Angular and Supabase**
