This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 📚 Documentation

### User Flow & Authentication

- **[Complete User Flow Guide](./docs/USER_FLOW.md)** - Registration, Sign-in, Onboarding, Usage, Logout
- **[Authentication State Diagrams](./docs/AUTH_STATE_DIAGRAMS.md)** - Visual flowcharts and state machines

### Performance & Optimization

- **[Performance Audit](./docs/performance-audit/README.md)** - Animation optimization & scroll performance fixes

### Codebase

- **[Documentation Hub](./docs/)** - All project documentation
- **[Codebase Organization](./docs/CLEANUP_SUMMARY.md)** - Project structure and standards

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, TailwindCSS, TypeScript
- **Backend**: Next.js API Routes
- **Authentication**: Better Auth v5
- **Database**: PostgreSQL with Prisma ORM
- **OAuth Providers**: Google (email/password also supported)
- **Security**: CSRF protection, rate limiting, OWASP headers

## Project Structure

```
ithaca-ui/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (public)/       # Public routes (auth, landing)
│   │   ├── (app)/          # Protected app routes
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── motion/        # Animation components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI primitives
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── proxy.ts           # Auth + security headers (Next.js proxy)
├── prisma/                # Database schema
├── docs/                  # Documentation
├── public/                # Static assets
└── package.json          # Dependencies
```

## Key Features

### Authentication

- ✅ OAuth 2.0 (Google)
- ✅ Email + Password (with strength validation)
- ✅ Session-based auth (7-day duration)
- ✅ Route protection via `src/proxy.ts`
- ✅ CSRF protection

### User Experience

- ✅ Sign-up / Registration
- ✅ Sign-in / Login
- ✅ Onboarding tutorial
- ✅ User dashboard
- ✅ Smooth logout

### Performance

- ✅ CSS containment for scroll optimization
- ✅ Mobile animation optimization
- ✅ GPU acceleration hints
- ✅ Target: 55-60 FPS scroll performance

### Security

- ✅ httpOnly cookies
- ✅ Rate limiting (10 req/min)
- ✅ OWASP security headers
- ✅ Content Security Policy (production)
- ✅ Password strength validation

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Better Auth Documentation](https://better-auth.com) - authentication framework
- [Prisma Documentation](https://www.prisma.io/docs) - database ORM

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
