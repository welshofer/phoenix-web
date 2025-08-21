# Phoenix Web - Project Documentation

## Project Overview
Phoenix Web is a Next.js application with Firebase backend services, built with TypeScript for type safety and better developer experience.

## Current Setup Status ✅
- **Next.js 15.5.0** - React framework with Pages Router
- **Firebase SDK** - Authentication, Firestore, and Storage configured
- **TypeScript** - Fully configured with strict type checking
- **MUI (Material-UI) & MUI X** - Component library and advanced components
- **Anonymous Authentication** - Enabled and working
- **Development Server** - Running on http://localhost:3001

## Project Structure
```
phoenix-web/app/
├── pages/              # Next.js pages (Pages Router)
│   └── index.tsx      # Main page with Firebase auth test
├── components/         # React components
│   └── slides/        # Slide presentation components
│       ├── SlideRenderer.tsx    # Main slide renderer
│       └── renderers/           # Individual slide type renderers
├── hooks/             # Custom React hooks
│   └── useAuth.ts    # Authentication hook
├── lib/               # Shared libraries and utilities
│   ├── firebase/      # Firebase configuration
│   │   ├── config.ts          # Firebase initialization
│   │   ├── collections.ts     # Typed Firestore collections
│   │   ├── converters.ts      # Firestore data converters
│   │   └── database.ts        # Database operations
│   └── models/        # TypeScript data models
│       ├── user.ts            # User model
│       ├── presentation.ts    # Presentation model
│       └── slide.ts           # Slide model
├── .env.local         # Environment variables (Firebase config)
├── next.config.js     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
```

## Firebase Services Available
- **Authentication** (`auth`) - Currently using Anonymous auth
- **Firestore** (`db`) - NoSQL document database
- **Storage** (`storage`) - File storage service

## TypeScript Development Rules

### 1. Type Safety First
- **ALWAYS** use TypeScript (.ts/.tsx) files, never plain JavaScript
- **NEVER** use `any` type - use `unknown` or proper types instead
- **ALWAYS** define interfaces/types for all data structures
- **USE** strict mode in tsconfig.json (already enabled)

### 2. Firebase Type Patterns
```typescript
// User types
interface User {
  uid: string;
  email?: string;
  displayName?: string;
  createdAt: Timestamp;
}

// Firestore document types
interface FirestoreDoc {
  id: string;
  // ... other fields
}

// Always type Firebase returns
import { User as FirebaseUser } from 'firebase/auth';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
```

### 3. Component Guidelines
- **USE** functional components with TypeScript
- **DEFINE** Props interfaces for all components
- **USE** React hooks with proper typing
```typescript
interface ComponentProps {
  title: string;
  count: number;
  onUpdate: (value: number) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, count, onUpdate }) => {
  // Component logic
};
```

### 4. State Management
- **USE** `useState` with explicit types: `useState<User | null>(null)`
- **USE** `useEffect` with proper cleanup functions
- **CONSIDER** Zustand (already installed) for global state
```typescript
// Zustand store example
interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
}
```

### 5. Async/Error Handling
- **ALWAYS** handle Firebase errors with try/catch
- **USE** proper loading states for async operations
- **TYPE** error objects when catching
```typescript
try {
  const result = await signInAnonymously(auth);
  // Handle success
} catch (error) {
  if (error instanceof FirebaseError) {
    console.error('Firebase error:', error.code, error.message);
  }
}
```

### 6. File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities/Hooks**: camelCase (e.g., `useAuth.ts`, `formatDate.ts`)
- **Types/Interfaces**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE

### 7. Import Organization
```typescript
// 1. React/Next imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. MUI imports
import { Box, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// 3. Firebase imports
import { auth, db } from '@/lib/firebase/config';
import { signInAnonymously } from 'firebase/auth';

// 4. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 5. Local components/utilities
import { SlideRenderer } from '@/components/slides/SlideRenderer';

// 6. Types/interfaces
import type { User } from '@/lib/models/user';
```

### 8. Environment Variables
- **PREFIX** all client-side env vars with `NEXT_PUBLIC_`
- **NEVER** commit `.env.local` to git
- **DOCUMENT** required env vars in README

### 9. Performance Best Practices
- **USE** dynamic imports for heavy components
- **IMPLEMENT** React.memo for expensive renders
- **USE** useCallback/useMemo where appropriate
- **OPTIMIZE** images with Next.js Image component

### 10. Security Rules
- **NEVER** expose sensitive Firebase config in client code
- **VALIDATE** all user inputs before Firebase operations
- **USE** Firebase Security Rules for database/storage
- **IMPLEMENT** proper authentication checks

## MUI (Material-UI) Guidelines

### Component Usage
- **USE** MUI components for consistent UI across the app
- **PREFER** MUI's sx prop for styling over inline styles
- **USE** MUI theme for consistent colors and spacing
- **LEVERAGE** MUI X components for complex data displays

### MUI Best Practices
```typescript
// Use sx prop for styling
<Box sx={{ p: 2, mb: 3, backgroundColor: 'primary.main' }}>

// Use MUI theme spacing
<Grid container spacing={2}>

// Proper Typography usage
<Typography variant="h1" component="h2" gutterBottom>

// MUI X DataGrid with TypeScript
<DataGrid<RowType>
  rows={data}
  columns={columns}
  pageSizeOptions={[10, 25, 50]}
/>
```

### Common MUI X Components
- **DataGrid**: For tabular data display (presentations list)
- **DatePicker**: For date selection
- **TreeView**: For hierarchical slide organization
- **Charts**: For analytics and metrics visualization

## Common Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
```

## Next Steps Checklist
- [ ] Set up ESLint with TypeScript rules
- [ ] Configure Prettier for code formatting
- [ ] Implement Firebase Security Rules
- [ ] Set up CI/CD pipeline
- [ ] Add error boundary components
- [ ] Implement proper logging system
- [ ] Set up testing infrastructure (Jest/React Testing Library)

## Firebase Configuration Notes
- Project ID: `phoenix-web-app`
- Auth Domain: `phoenix-web-app.firebaseapp.com`
- Storage Bucket: `phoenix-web-app.firebasestorage.app`
- Anonymous Authentication: Enabled

## Development Tips
1. Always check TypeScript errors before committing
2. Use Firebase Emulators for local development when possible
3. Keep components small and focused
4. Write types before implementation
5. Document complex business logic

## Troubleshooting
- **Port 3000 in use**: App will auto-switch to 3001
- **Firebase auth error**: Ensure Anonymous Auth is enabled in console
- **TypeScript errors**: Run `npm run typecheck` to see all errors
- **Module not found**: Check import paths use `@/` alias correctly

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Web Documentation](https://firebase.google.com/docs/web/setup)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)