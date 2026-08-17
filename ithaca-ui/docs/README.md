# Documentation

This directory contains all documentation for the Ithaca UI project, including guides, audits, reference materials, and user flow documentation.

## Structure

```
docs/
├── README.md (this file)
├── USER_FLOW.md ⭐ Complete user authentication and usage flow
├── AUTH_STATE_DIAGRAMS.md ⭐ Visual state diagrams and flowcharts
├── CLEANUP_SUMMARY.md - Codebase organization summary
├── performance-audit/
│   ├── README.md
│   ├── ANIMATION_PERFORMANCE_AUDIT_FIXES.css
│   ├── CANVAS_LAYOUT_PATCHED.tsx
│   ├── GRAPH_CONSTELLATION_PATCHED.tsx
│   └── hooks_useAnimationPause.ts
└── guides/
    └── (guides to be added)
```

## Documentation Overview

### 🔐 User Authentication & Flow (NEW!)

**Start here for understanding how users interact with the app:**

1. **[`USER_FLOW.md`](./USER_FLOW.md)** - Complete user journey documentation
   - Registration / Sign-up flow (OAuth & Email)
   - Sign-in / Login flow
   - Session management (7-day duration)
   - Onboarding tutorial flow
   - Dashboard and app usage
   - Logout flow
   - Route protection
   - Architecture reference
   - Environment setup
   - Developer guide

2. **[`AUTH_STATE_DIAGRAMS.md`](./AUTH_STATE_DIAGRAMS.md)** - Visual diagrams
   - Complete user journey flowchart
   - Authentication flow diagram
   - Session lifecycle
   - Route protection flow
   - Dashboard state flow
   - Logout flow diagram
   - Database transaction flow
   - OAuth provider interaction
   - Security checkpoint flow
   - Complete state machine

### ⚡ Performance & Optimization

Contains comprehensive performance audit results and reference files showing all optimizations applied to improve animation and scroll performance.

**[`performance-audit/README.md`](./performance-audit/README.md)** - Performance audit guide

- Animation optimization techniques
- CSS containment and GPU acceleration
- Mobile performance improvements
- Tab visibility optimization
- Performance metrics (55-60 FPS target)

### 🏗️ Architecture & Organization

**[`CLEANUP_SUMMARY.md`](./CLEANUP_SUMMARY.md)** - Codebase organization

- Root directory cleanup
- Documentation structure
- Source code organization
- Standards compliance
- No regressions

## Key Features Documented

### Authentication

- ✅ OAuth (Google, ORCID)
- ✅ Email + Password
- ✅ Magic Link (planned)
- ✅ Session-based auth (7 days)
- ✅ httpOnly cookies
- ✅ CSRF protection

### User Flow

- ✅ Registration process
- ✅ Sign-in with multiple providers
- ✅ Onboarding tutorial
- ✅ Dashboard with stats
- ✅ App usage (Explore, Projects, Search)
- ✅ Logout and session cleanup

### Security

- ✅ Route protection (middleware)
- ✅ Rate limiting (10 req/min)
- ✅ OWASP security headers
- ✅ Email verification (ready to enable)
- ✅ Password strength validation (8-128 chars)

## Quick Navigation

| Topic                 | File                                                                           | Purpose                 |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------- |
| **User Registration** | [`USER_FLOW.md#1-registration`](./USER_FLOW.md#1-registration--sign-up-flow)   | Complete sign-up flow   |
| **User Sign In**      | [`USER_FLOW.md#2-sign-in`](./USER_FLOW.md#2-sign-in--login-flow)               | Login process           |
| **Sessions**          | [`USER_FLOW.md#3-session`](./USER_FLOW.md#3-session-management)                | 7-day session lifecycle |
| **Onboarding**        | [`USER_FLOW.md#4-onboarding`](./USER_FLOW.md#4-onboarding)                     | Tutorial flow           |
| **Dashboard**         | [`USER_FLOW.md#5-app-usage`](./USER_FLOW.md#5-app-usage--dashboard)            | User dashboard          |
| **Logout**            | [`USER_FLOW.md#6-logout`](./USER_FLOW.md#6-logout-flow)                        | Sign-out process        |
| **Route Protection**  | [`USER_FLOW.md#7-route-protection`](./USER_FLOW.md#7-route-protection)         | Middleware security     |
| **Auth Architecture** | [`USER_FLOW.md#architecture-reference`](./USER_FLOW.md#architecture-reference) | Tech stack & design     |
| **Flow Diagrams**     | [`AUTH_STATE_DIAGRAMS.md`](./AUTH_STATE_DIAGRAMS.md)                           | Visual representations  |

## File Links

### Authentication Components

- Sign-up: `src/app/(public)/signup/page.tsx` (339 lines)
- Sign-in: `src/app/(public)/signin/page.tsx` (247 lines)
- Dashboard: `src/app/(app)/dashboard/page.tsx` (425 lines)
- User menu: `src/components/auth/user-menu.tsx` (201 lines)
- Onboarding: `src/components/auth/onboarding-dialog.tsx` (124 lines)

### Configuration Files

- Auth config: `src/lib/auth.ts` (78 lines)
- Middleware: `src/middleware.ts` (121 lines)
- ORCID provider: `src/lib/auth-orcid.ts` (68 lines)
- Database schema: `prisma/schema.prisma` (74 lines)

## For Different Audiences

### 👤 End Users

- Start with: [USER_FLOW.md - Quick Start](./USER_FLOW.md#quick-start)
- Visual guide: [AUTH_STATE_DIAGRAMS.md - User Journey](./AUTH_STATE_DIAGRAMS.md#1-complete-user-journey-flowchart)

### 👨‍💻 Developers

- Complete guide: [USER_FLOW.md](./USER_FLOW.md)
- Developer guide: [USER_FLOW.md - Developer Guide](./USER_FLOW.md#developer-guide)
- Architecture: [USER_FLOW.md - Architecture](./USER_FLOW.md#architecture-reference)

### 🔒 Security Reviewers

- Security checks: [AUTH_STATE_DIAGRAMS.md - Security](./AUTH_STATE_DIAGRAMS.md#9-security-checkpoint-flow)
- Route protection: [USER_FLOW.md - Route Protection](./USER_FLOW.md#7-route-protection)
- Environment setup: [USER_FLOW.md - Environment](./USER_FLOW.md#environment-setup)

### ⚡ Performance Teams

- Performance audit: [performance-audit/README.md](./performance-audit/README.md)
- Optimizations: [performance-audit/](./performance-audit/)
- Improvements: 45-50 FPS → 55-60 FPS ✅

## Contributing

When adding new documentation:

1. Organize files by topic in appropriate subdirectories
2. Always include a README.md in each directory
3. Link related documents together
4. Keep documentation up-to-date with code changes
5. Use clear headings and formatting for readability
6. Include code examples and file references
7. Add visual diagrams for complex flows

## Last Updated

- User Flow Documentation: Jan 20, 2024
- Performance Audit: Jan 20, 2024
- Cleanup Summary: Jan 20, 2024

---

**Next Steps:** Start with [USER_FLOW.md](./USER_FLOW.md) to understand the complete user authentication and usage flow!
