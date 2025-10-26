# TechRise - User Profile Management Application

A modern Angular application for user registration, authentication, and profile management built with Supabase backend integration.

## Features

- **User Registration**: Multi-step registration form with country selection, phone validation, and avatar upload
- **Email Verification**: Mock verification system with 6-digit code input
- **User Authentication**: Secure sign-in/sign-out functionality
- **Profile Management**: View and edit user profiles with avatar support
- **Responsive Design**: Modern UI built with Angular Material components

## Tech Stack

- **Frontend**: Angular 20.3.0 with TypeScript
- **UI Framework**: Angular Material 20.2.10
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Angular Signals
- **Form Handling**: Reactive Forms with custom validators
- **File Upload**: Avatar image upload to Supabase Storage

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route protection
│   ├── services/        # Auth, Supabase, User services
│   └── utils/           # Validators and constants
├── features/
│   ├── sign-up/         # Registration flow
│   ├── sign-in/         # Authentication
│   └── profile/         # Profile management
├── layout/
│   └── navbar/          # Navigation component
└── shared/
    ├── models/          # TypeScript interfaces
    └── pipes/           # Custom pipes
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Supabase:

   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Update environment variables in `src/environments/`

4. Start the development server:

   ```bash
   npm start
   ```

5. Navigate to `http://localhost:4200`

## Key Components

### Authentication Flow

- **SignUp**: Multi-step form with validation, country selection, and file upload
- **SignIn**: Email/password authentication with error handling
- **AuthGuard**: Protects profile routes from unauthenticated users

### Profile Management

- **Profile View**: Displays user information with avatar support
- **Edit Profile**: Modal-based editing with real-time updates
- **Avatar Upload**: File upload to Supabase Storage with validation

### Data Models

- **User**: Complete user profile with metadata
- **SignUpData**: Registration form data structure
- **CountryInfo**: Country selection with flags and dial codes

## Database Schema

The application uses a `user_profiles` table with the following structure:

- User authentication via Supabase Auth
- Profile data stored in PostgreSQL
- Avatar images in Supabase Storage
- Row Level Security (RLS) policies for data protection

## Development Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build with file watching

## Configuration

Environment variables are configured in:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Required Supabase configuration:

- Project URL
- Anonymous key
- Database schema setup

## Security Features

- Row Level Security (RLS) policies
- User authentication and authorization
- Secure file upload with user-specific storage
- Form validation and sanitization
- Protected routes with auth guards

## Browser Support

Modern browsers supporting ES2020+ features. Tested on Chrome, Firefox, Safari, and Edge.
