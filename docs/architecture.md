# LocalSquares Architecture

## Overview

LocalSquares is a visual neighborhood billboard platform built with a modern, scalable architecture optimized for mobile-first usage, outdoor readability, and Bahamian context.

## System Architecture

```
┌─────────────────┐
│   Vercel CDN    │  Frontend (Next.js 14)
│   (Edge)        │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   FastAPI       │  Backend API
│   (Railway/     │
│    Fly.io)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
┌───▼───┐ ┌──▼───┐    ┌─────▼─────┐
│Supabase│ │Cloudflare│   │Analytics │
│  Auth  │ │ Images   │   │ (Events) │
│  + DB  │ │   CDN    │   │          │
└────────┘ └──────────┘   └──────────┘
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Design System
- **Animation**: Framer Motion
- **Maps**: Mapbox GL JS
- **Auth Client**: Supabase JS
- **Deployment**: Vercel

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Railway or Fly.io

### Infrastructure

- **CDN**: Vercel Edge Network
- **Image CDN**: Cloudflare Images (optional)
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Data Flow

### Pin Creation Flow

```
1. User → Frontend (OnboardingFlow)
2. Frontend → Supabase Auth (Sign up/Sign in)
3. Frontend → Supabase Storage (Upload image)
4. Frontend → Supabase Database (Create pin record)
5. Frontend → Backend API (Optional: Process image via Cloudflare)
```

### Pin View Flow

```
1. User → Frontend (Board Page)
2. Frontend → Supabase Database (Fetch pins)
3. Frontend → Backend API (Track impression)
4. Backend → Supabase Database (Store impression)
5. Frontend → Cloudflare CDN (Serve optimized images)
```

### Analytics Flow

```
1. User → Frontend (View/Click)
2. Frontend → Backend API (Track event)
3. Backend → Supabase Database (Store event)
4. Backend → Supabase Database (Update pin stats)
```

## Database Schema

### Core Tables

- **users**: User profiles (merchants, admins)
- **boards**: Neighborhood boards
- **pins**: Business listings
- **pin_slots**: Grid positions
- **impressions**: View tracking
- **clicks**: Interaction tracking
- **payments**: Payment records (future)
- **reports**: Moderation reports

### Key Design Decisions

- **JSONB for metadata**: Flexible pin metadata (hours, contact, location)
- **Row-Level Security (RLS)**: Data access control at database level
- **Denormalized stats**: View/click counts stored on pins for quick access
- **Indexes**: Optimized for common queries (board_id, status, created_at)

## Security

### Authentication

- **Supabase Auth**: Handles user authentication
- **JWT Tokens**: Secure session management
- **Magic Links**: Passwordless email auth
- **SMS Verification**: Phone-based auth

### Authorization

- **RLS Policies**: Database-level access control
- **Role-Based Access**: Merchant vs Admin roles
- **Owner Checks**: Users can only modify their own data

### Data Protection

- **HTTPS Only**: All traffic encrypted
- **Environment Variables**: Secrets stored securely
- **CORS Configuration**: Restricted API access
- **Input Validation**: Pydantic models validate all inputs

## Performance Optimizations

### Frontend

- **Server Components**: Next.js 14 App Router
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Images load on demand
- **Code Splitting**: Automatic with Next.js
- **Edge Caching**: Vercel Edge Network

### Backend

- **Async Operations**: FastAPI async endpoints
- **Connection Pooling**: Supabase client pooling
- **Caching**: Consider Redis for frequently accessed data (future)

### Database

- **Indexes**: On frequently queried columns
- **JSONB Indexes**: For metadata queries
- **Query Optimization**: Efficient joins and filters

### Images

- **CDN Delivery**: Cloudflare Images for global edge
- **Thumbnails**: Pre-generated for grid view
- **Format Optimization**: WebP with JPEG fallback
- **Lazy Loading**: Images load as user scrolls

## Scalability Considerations

### Current Architecture

- Handles thousands of users
- Supports hundreds of pins per board
- Efficient for single-region deployment (Nassau)

### Future Scaling

- **Horizontal Scaling**: Backend can scale on Railway/Fly.io
- **Database Scaling**: Supabase handles scaling
- **CDN Scaling**: Vercel and Cloudflare scale automatically
- **Caching Layer**: Add Redis for frequently accessed data
- **Read Replicas**: Supabase supports read replicas

## Monitoring & Observability

### Current

- **Vercel Analytics**: Frontend metrics
- **Railway/Fly.io Logs**: Backend logs
- **Supabase Dashboard**: Database metrics

### Future

- **Error Tracking**: Sentry or similar
- **APM**: Application performance monitoring
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Custom Dashboards**: Grafana for analytics

## Design Principles

1. **Mobile-First**: Optimized for mobile devices
2. **Visual-First**: Images over text
3. **Bold Typography**: Readable outdoors in sunlight
4. **Low Cognitive Load**: Simple, intuitive interface
5. **Fast Loading**: Optimized for weak mobile networks
6. **Bahamian Context**: Local references and culture

## Future Enhancements

- **AI Features**: Auto-generated captions, image optimization
- **Dynamic Pricing**: Demand-based pricing for featured pins
- **Event Boards**: Temporary boards for events/festivals
- **VerityOS Integration**: Sovereign local data management
- **Web3 Features**: Tokenized featured pins (optional)

