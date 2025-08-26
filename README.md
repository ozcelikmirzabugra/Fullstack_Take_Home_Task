# 🚀 Professional Task Manager

A production-ready task management application built with **Next.js 15**, **TypeScript**, **Supabase**, and **shadcn/ui**. This project demonstrates enterprise-grade features including authentication, caching, rate limiting, security headers, and automated maintenance.

## ✨ Features

- **🔐 Secure Authentication** - Supabase Auth with email/password
- **📝 Task Management** - Full CRUD operations for tasks
- **🔒 Row Level Security** - Database-level access control
- **⚡ Performance Optimization** - Redis caching with TTL
- **🛡️ Security Headers** - CSP, CORS, and security middleware
- **🚦 Rate Limiting** - IP + user-based limiting with sliding window
- **📊 Real-time Updates** - Instant cache invalidation
- **🤖 Automated Maintenance** - Scheduled task archiving
- **📱 Responsive Design** - Dark theme with professional UI

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **shadcn/ui** for modern UI components
- **TailwindCSS** for styling
- **React Hook Form** + **Zod** for form validation

### Backend
- **Supabase** for database and authentication
- **Row Level Security (RLS)** for data protection
- **Next.js API Routes** for server-side logic
- **Server Actions** for form handling

### Performance & Security
- **Upstash Redis** for caching and rate limiting
- **CSP (Content Security Policy)** with nonce-based scripts
- **CORS** configuration
- **Rate limiting** with sliding window algorithm
- **Input validation** with Zod schemas

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Upstash Redis instance (or Vercel KV)

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd task-manager
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis/Upstash Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=development
```

### 3. Database Setup
Run the SQL commands from `supabase-schema.sql` in your Supabase SQL Editor:

```sql
-- This will create:
-- ✅ profiles and tasks tables
-- ✅ RLS policies for data security
-- ✅ Indexes for performance
-- ✅ Triggers for automatic timestamps
-- ✅ User profile creation on signup
```

### 4. Cron Job Setup (Optional)
For automated task archiving, set up the cron job from `supabase-cron-function.sql`:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily archiving at 3:00 AM UTC
SELECT cron.schedule(
    'archive-old-tasks',
    '0 3 * * *',
    $$
    UPDATE public.tasks 
    SET status = 'archived', updated_at = NOW()
    WHERE status = 'done' 
    AND updated_at < NOW() - INTERVAL '30 days';
    $$
);
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🗄️ Database Schema

### Tables

#### `profiles`
```sql
- id: uuid (FK to auth.users)
- full_name: text
- created_at: timestamptz
```

#### `tasks`
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- title: text (required)
- description: text (optional)
- status: enum ('todo', 'in_progress', 'done', 'archived')
- due_date: date (optional)
- created_at: timestamptz
- updated_at: timestamptz
```

### RLS Policies

All tables have Row Level Security enabled with the following policies:

1. **tasks_select_own**: Users can only SELECT their own tasks
2. **tasks_insert_own**: Users can only INSERT tasks for themselves
3. **tasks_update_own**: Users can only UPDATE their own tasks  
4. **tasks_delete_own**: Users can only DELETE their own tasks

## 🚀 API Documentation

### Authentication Endpoints
- `POST /api/auth/logout` - Sign out user

### Task Endpoints
- `GET /api/tasks` - List user's tasks (cached)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get single task (cached)
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Admin Endpoints (Demo)
- `GET /api/admin/archive-tasks` - Check archivable tasks
- `POST /api/admin/archive-tasks` - Manually archive old tasks

## 📊 Caching Strategy

### Cache Keys
- `tasks:{userId}` - User's task list (TTL: 60s)
- `task:{userId}:{taskId}` - Individual task (TTL: 60s)

### Cache Invalidation
- **CREATE**: Invalidates user's task list cache
- **UPDATE**: Invalidates both task list and individual task cache
- **DELETE**: Invalidates both task list and individual task cache

### Cache Headers
- `X-Cache: HIT` - Data served from cache
- `X-Cache: MISS` - Data fetched from database

## 🛡️ Security Implementation

### Content Security Policy (CSP)
```javascript
"default-src 'self'; script-src 'self' 'nonce-<nonce>'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';"
```

**Why nonce-based scripts?**
- Prevents XSS attacks by only allowing scripts with valid nonces
- More secure than `'unsafe-inline'` or broad script allowlists
- Maintains compatibility with Next.js hydration

### Security Headers
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### CORS Policy
- Configurable allowed origins via `CORS_ORIGINS` environment variable
- Proper preflight handling for complex requests
- Credentials support for authenticated requests

## 🚦 Rate Limiting

### Strategy: Sliding Window
- **Read operations**: 60 requests per 60 seconds per user+IP
- **Write operations**: 20 requests per 60 seconds per user+IP  
- **Auth operations**: 10 requests per 60 seconds per user+IP

### Rate Limit Headers
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp
- `Retry-After` - Seconds to wait (on 429 responses)

### Implementation
```typescript
// User + IP based keys for accurate limiting
const rateLimitKey = createRateLimitKey(user.id, ip)
const result = await checkRateLimit(writeLimiter, rateLimitKey)

if (!result.success) {
  return 429 with Retry-After header
}
```

## 🤖 Scheduled Tasks (Cron Jobs)

### Task Archiving
- **Schedule**: Daily at 3:00 AM UTC (`0 3 * * *`)
- **Action**: Move tasks with status `done` older than 30 days to `archived`
- **Implementation**: PostgreSQL `pg_cron` extension
- **Monitoring**: Execution logs in Supabase

### Manual Trigger (Demo)
```bash
# Check archivable tasks
curl -X GET http://localhost:3000/api/admin/archive-tasks

# Manually trigger archiving
curl -X POST http://localhost:3000/api/admin/archive-tasks
```

## 🧪 Validation

### Zod Schemas
- **TaskCreateSchema**: Validates task creation (title, description, status, due_date)
- **TaskUpdateSchema**: Validates task updates (all fields optional)
- **UserLoginSchema**: Validates login credentials
- **UserSignupSchema**: Validates registration data

### Security Features
- **Strict parsing**: `.strict()` prevents extra fields
- **Input sanitization**: Automatic type coercion and validation
- **Error handling**: Detailed validation error responses

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
UPSTASH_REDIS_REST_URL=your_production_redis_url
UPSTASH_REDIS_REST_TOKEN=your_production_redis_token
CORS_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

## 🧪 Testing the Application

### Authentication Flow
1. Visit homepage (`/`)
2. Click "Create Account" 
3. Fill registration form
4. Check email for verification link
5. Sign in with credentials
6. Access dashboard

### CRUD Operations
1. **Create**: Click "New Task" button
2. **Read**: View tasks in dashboard or individual task pages
3. **Update**: Click "Edit" on any task
4. **Delete**: Click "Delete" with confirmation dialog

### Cache Testing
1. Create a task (cache MISS)
2. Refresh dashboard (cache HIT)
3. Update the task (cache invalidation)
4. Refresh dashboard (cache MISS, then HIT)

### Rate Limiting
1. Make rapid API requests
2. Wait for reset period
3. Requests allowed again

### Security Headers
1. Open browser dev tools
2. Check Network tab for response headers
3. Verify CSP, CORS, and security headers present

## 📊 Loom Demo Checklist

### Core Functionality
- [ ] User registration and login
- [ ] Create, read, update, delete tasks
- [ ] Task status transitions
- [ ] Due date management

### Performance Features  
- [ ] Cache HIT/MISS demonstration
- [ ] Cache invalidation on updates
- [ ] Response time improvements

### Security Features
- [ ] Rate limiting
- [ ] Security headers in dev tools
- [ ] CSP preventing inline scripts
- [ ] CORS handling

### Advanced Features
- [ ] Zod validation errors
- [ ] Manual cron job trigger
- [ ] Database RLS preventing unauthorized access

## 🐛 Troubleshooting

### Common Issues
1. **Environment variables not loading**: Ensure `.env.local` file exists and has correct format
2. **Supabase connection errors**: Verify URL and keys in Supabase dashboard
3. **Redis connection issues**: Check Upstash credentials and network access
4. **RLS policy blocking queries**: Verify user authentication and policy syntax

### Debug Mode
Set `NODE_ENV=development` for detailed error logging and relaxed security policies.

## 📝 License

This project is for demonstration purposes as part of a take-home assignment.

---

**Built with Next.js 15, Supabase, and modern web technologies**