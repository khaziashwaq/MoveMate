# MoveMate — Production Architecture

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ Server        │  │ Client        │  │ Server        │                   │
│  │ Components    │  │ Components    │  │ Actions       │                   │
│  │ (RSC)         │  │ (Interactive) │  │ (Mutations)   │                   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                   │
│          │                   │                   │                           │
│          │                   ▼                   │                           │
│          │          ┌───────────────┐            │                           │
│          │          │ React Query   │            │                           │
│          │          │ (Client Cache)│            │                           │
│          │          └───────┬───────┘            │                           │
└──────────┼──────────────────┼────────────────────┼───────────────────────────┘
           │                  │                    │
           ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS SERVER (Edge/Node)                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ Route         │  │ API Routes    │  │ Middleware     │                   │
│  │ Handlers      │  │ (/api/*)      │  │ (Auth Guard)   │                   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                   │
└──────────┼──────────────────┼────────────────────┼───────────────────────────┘
           │                  │                    │
           ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE PLATFORM                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ PostgreSQL    │  │ Auth          │  │ Storage       │  │ Realtime    │ │
│  │ (Database)    │  │ (JWT/Sessions)│  │ (Files/Images)│  │ (WebSocket) │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘ │
│  ┌───────────────┐  ┌───────────────┐                                      │
│  │ Edge          │  │ Row Level     │                                      │
│  │ Functions     │  │ Security (RLS)│                                      │
│  └───────────────┘  └───────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── callback/
│   │   │   └── route.ts         # OAuth callback handler
│   │   └── layout.tsx           # Minimal auth layout
│   │
│   ├── (platform)/              # Authenticated platform route group
│   │   ├── layout.tsx           # Platform shell (nav, sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── marketplace/         # Buy/sell furniture
│   │   │   ├── page.tsx         # Listings feed
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Single listing detail
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create listing
│   │   │   └── edit/[id]/
│   │   │       └── page.tsx
│   │   ├── rooms/               # Find rooms
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── roommates/           # Find roommates / flatmate replacements
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── messages/            # In-app messaging
│   │   │   ├── page.tsx
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── edit/
│   │   │       └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                     # API route handlers
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── upload/
│   │       └── route.ts         # Signed URL generation
│   │
│   ├── layout.tsx               # Root layout (providers, fonts)
│   ├── page.tsx                 # Landing page (public)
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx
│   └── loading.tsx
│
├── features/                    # Feature-based modules
│   ├── auth/
│   │   ├── actions/             # Server actions
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   └── logout.ts
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── oauth-buttons.tsx
│   │   ├── hooks/
│   │   │   └── use-session.ts
│   │   └── schemas/
│   │       └── auth.schema.ts   # Zod schemas
│   │
│   ├── marketplace/
│   │   ├── actions/
│   │   │   ├── create-listing.ts
│   │   │   ├── update-listing.ts
│   │   │   ├── delete-listing.ts
│   │   │   └── toggle-favorite.ts
│   │   ├── components/
│   │   │   ├── listing-card.tsx
│   │   │   ├── listing-grid.tsx
│   │   │   ├── listing-form.tsx
│   │   │   ├── listing-filters.tsx
│   │   │   ├── image-upload.tsx
│   │   │   └── price-input.tsx
│   │   ├── hooks/
│   │   │   ├── use-listings.ts
│   │   │   ├── use-listing.ts
│   │   │   └── use-favorites.ts
│   │   ├── queries/
│   │   │   ├── get-listings.ts
│   │   │   └── get-listing.ts
│   │   ├── schemas/
│   │   │   └── listing.schema.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── rooms/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── queries/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── roommates/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── queries/
│   │   ├── schemas/
│   │   └── types/
│   │
│   └── messages/
│       ├── actions/
│       ├── components/
│       ├── hooks/
│       ├── queries/
│       └── types/
│
├── shared/                      # Shared utilities & components
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (auto-generated)
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── common/
│   │       ├── image-gallery.tsx
│   │       ├── location-picker.tsx
│   │       ├── avatar.tsx
│   │       └── empty-state.tsx
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-infinite-scroll.ts
│   └── utils/
│       ├── cn.ts                # clsx + twMerge
│       ├── format-price.ts
│       ├── format-date.ts
│       └── constants.ts
│
├── lib/                         # Infrastructure / SDK clients
│   ├── supabase/
│   │   ├── client.ts            # Browser client (createBrowserClient)
│   │   ├── server.ts            # Server client (createServerClient)
│   │   ├── middleware.ts        # Supabase auth middleware helper
│   │   ├── admin.ts             # Service role client (server-only)
│   │   └── database.types.ts   # Generated DB types (supabase gen types)
│   ├── react-query/
│   │   ├── provider.tsx         # QueryClientProvider wrapper
│   │   └── query-client.ts     # QueryClient config
│   └── storage/
│       └── upload.ts            # Upload helpers (signed URLs, resize)
│
├── middleware.ts                # Next.js middleware (auth + redirects)
│
├── config/
│   ├── site.ts                  # Site metadata
│   ├── navigation.ts            # Nav items
│   └── env.ts                   # Validated env vars (zod)
│
└── types/
    ├── database.ts              # Derived domain types from DB types
    └── global.d.ts              # Global type augmentations
```

---

## 3. Feature-Based Architecture

### Principles

| Principle | Implementation |
|-----------|---------------|
| **Colocation** | Each feature owns its actions, components, hooks, queries, schemas, and types |
| **Encapsulation** | Features never import from each other's internals — shared code lives in `shared/` |
| **Single Responsibility** | Each feature maps to one domain concept (marketplace, rooms, roommates, messages) |
| **Layered I/O** | `queries/` = read, `actions/` = write, `hooks/` = client-side orchestration |

### Import Rules

```
app/         → features/, shared/, lib/
features/X   → shared/, lib/        (NEVER features/Y)
shared/      → lib/
lib/         → (external packages only)
```

This creates a **dependency DAG** — no cycles, clear ownership, easy to extract into packages later.

---

## 4. Server/Client Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER BOUNDARY                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ page.tsx    │  │ layout.tsx  │  │ Server Actions       │ │
│  │ (RSC)       │  │ (RSC)       │  │ "use server"         │ │
│  │             │  │             │  │                       │ │
│  │ • Fetch data│  │ • Auth check│  │ • Validate (Zod)     │ │
│  │ • DB query  │  │ • Nav render│  │ • Mutate DB          │ │
│  │ • No state  │  │ • Providers │  │ • Revalidate cache   │ │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘ │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │ Props (serializable)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BOUNDARY                            │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ "use client"    │  │ "use client"    │                   │
│  │                  │  │                  │                   │
│  │ • Forms         │  │ • Filters        │                   │
│  │ • Interactivity │  │ • Infinite scroll│                   │
│  │ • Optimistic UI │  │ • Real-time      │                   │
│  │ • React Query   │  │ • Animations     │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Decision Matrix

| Scenario | Boundary | Reason |
|----------|----------|--------|
| Listing detail page | Server | Static data, SEO, no interactivity |
| Listing filters/search | Client | User input, debounced queries |
| Image upload form | Client | File handling, progress state |
| Create listing action | Server Action | Mutation, validation, DB write |
| Messages conversation | Client | Real-time, WebSocket, local state |
| User profile page | Server (with client islands) | Mostly static, edit button is client |
| Navigation/sidebar | Server | Static render, no state |

---

## 5. Data Flow

### Read Path (Server Components)

```
Browser Request
    │
    ▼
Next.js Middleware (validate session cookie)
    │
    ▼
Server Component (page.tsx)
    │
    ├── createServerClient(cookies)
    │       │
    │       ▼
    │   Supabase Query (.from('listings').select(...))
    │       │
    │       ▼
    │   PostgreSQL (RLS enforced automatically)
    │
    ▼
RSC Payload → HTML Stream → Browser
```

### Read Path (Client Components — React Query)

```
Client Component mounts
    │
    ▼
useQuery({ queryKey: ['listings', filters], queryFn })
    │
    ├── Cache HIT → Return cached data
    │
    ├── Cache MISS/STALE
    │       │
    │       ▼
    │   fetch('/api/...') OR supabaseBrowserClient.from(...)
    │       │
    │       ▼
    │   Supabase (RLS enforced via user JWT)
    │
    ▼
Component re-renders with data
```

### Write Path (Server Actions)

```
Client Form Submit
    │
    ▼
"use server" action invoked
    │
    ├── 1. Validate input (Zod schema)
    ├── 2. Authenticate (getUser from session)
    ├── 3. Authorize (check ownership/permissions)
    ├── 4. Mutate (Supabase insert/update/delete)
    ├── 5. Revalidate cache (revalidatePath / revalidateTag)
    │
    ▼
Return { success, data?, error? }
    │
    ▼
Client: React Query invalidation + optimistic rollback if needed
```

### Real-Time Path (Messages)

```
Client subscribes to Supabase Realtime channel
    │
    ▼
supabase.channel('messages:conversation_id')
  .on('postgres_changes', { event: 'INSERT', ... }, callback)
  .subscribe()
    │
    ▼
New message inserted by other user → RLS check → broadcast
    │
    ▼
Client callback fires → React Query cache update (setQueryData)
    │
    ▼
UI re-renders with new message (no refetch needed)
```

---

## 6. Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        AUTH FLOW                                   │
└──────────────────────────────────────────────────────────────────┘

  ┌─────────┐         ┌──────────┐        ┌──────────────┐
  │ Browser │         │ Next.js  │        │   Supabase   │
  │         │         │ Server   │        │   Auth       │
  └────┬────┘         └────┬─────┘        └──────┬───────┘
       │                   │                      │
       │ 1. POST /login    │                      │
       │ (email+password)  │                      │
       │──────────────────►│                      │
       │                   │ 2. signInWithPassword│
       │                   │─────────────────────►│
       │                   │                      │
       │                   │ 3. Returns session   │
       │                   │ (access_token,       │
       │                   │  refresh_token)      │
       │                   │◄─────────────────────│
       │                   │                      │
       │ 4. Set HTTP-only  │                      │
       │ cookies (tokens)  │                      │
       │◄──────────────────│                      │
       │                   │                      │
       │ 5. Subsequent     │                      │
       │ requests include  │                      │
       │ cookies auto      │                      │
       │──────────────────►│                      │
       │                   │ 6. Middleware:        │
       │                   │ refresh if expired    │
       │                   │─────────────────────►│
       │                   │◄─────────────────────│
       │                   │                      │
```

### Auth Strategy

| Aspect | Decision |
|--------|----------|
| **Session storage** | HTTP-only cookies (via `@supabase/ssr`) |
| **Token refresh** | Middleware refreshes on every request if <60s to expiry |
| **OAuth providers** | Google, GitHub (expandable) |
| **Protected routes** | Middleware pattern-matches `/(platform)/**` |
| **Public routes** | Landing, login, register, callback |
| **RLS integration** | JWT `sub` claim = `auth.uid()` in all policies |

### Middleware Logic

```
middleware.ts:
  1. Create Supabase server client with request cookies
  2. Call getUser() — refreshes token if needed
  3. If no user + accessing protected route → redirect /login
  4. If user + accessing auth routes → redirect /dashboard
  5. Pass updated cookies to response
```

---

## 7. Storage Strategy

### Supabase Storage Buckets

| Bucket | Purpose | Access | Max Size |
|--------|---------|--------|----------|
| `listings` | Furniture images | Public (read), Auth (write) | 5MB/file |
| `rooms` | Room/apartment photos | Public (read), Auth (write) | 5MB/file |
| `avatars` | Profile pictures | Public (read), Auth (write) | 2MB/file |
| `documents` | Verification docs | Private (owner only) | 10MB/file |

### Upload Flow

```
Client (image selected)
    │
    ▼
Client-side validation (type, size, dimensions)
    │
    ▼
Server Action: generate signed upload URL
    │ (validates auth, generates path: listings/{user_id}/{uuid}.webp)
    │
    ▼
Client: direct upload to Supabase Storage via signed URL
    │
    ▼
Client: receives public URL → stores in form state
    │
    ▼
On form submit: URL references saved to DB record
```

### Storage Policies (RLS)

- **Read**: Public for `listings`, `rooms`, `avatars`; owner-only for `documents`
- **Write**: Authenticated users, scoped to their own `user_id` folder
- **Delete**: Owner only (matches `user_id` prefix in path)
- **Update**: Not allowed (upload new, delete old)

### Image Optimization

- Accept: JPEG, PNG, WebP, AVIF
- Transform on read via Supabase Image Transformations (resize, format)
- Store originals; serve optimized via `?width=400&format=webp` query params
- Next.js `<Image>` component with Supabase loader for automatic optimization

---

## 8. API Design

### Server Actions (Primary Mutation API)

Server Actions are the **primary write API**. No REST endpoints needed for CRUD.

```
features/marketplace/actions/create-listing.ts

  Input:  Zod-validated FormData
  Auth:   getUser() from server session
  Output: { success: boolean; data?: Listing; error?: string }
```

### API Routes (Edge Cases Only)

| Route | Purpose |
|-------|---------|
| `POST /api/webhooks/stripe` | Payment webhook (external caller) |
| `POST /api/upload` | Signed URL generation (could be server action too) |
| `GET /api/og/[type]/[id]` | Dynamic OG image generation |

### Query Patterns

Direct Supabase client calls in:
- **Server Components** → `createServerClient` (uses cookies, RLS enforced)
- **Client Components** → `createBrowserClient` (uses JWT in memory, RLS enforced)

### Pagination Strategy

- **Cursor-based** for feeds (marketplace, rooms, roommates)
- **React Query `useInfiniteQuery`** for infinite scroll on client
- Server components use offset for initial SSR page

### Search & Filtering

- Supabase full-text search (`to_tsvector`, `plainto_tsquery`) for text
- PostGIS for location-based queries (nearby rooms)
- Composite indexes on common filter combinations (category + city + price range)

---

## 9. Database Schema (High-Level)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   profiles   │       │    listings      │       │     rooms        │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (FK auth) │──┐    │ id               │       │ id               │
│ full_name    │  │    │ seller_id (FK)───│───┐   │ poster_id (FK)───│──┐
│ avatar_url   │  │    │ title            │   │   │ title            │  │
│ bio          │  │    │ description      │   │   │ location         │  │
│ location     │  │    │ price            │   │   │ rent             │  │
│ phone        │  │    │ category         │   │   │ available_from   │  │
│ verified     │  │    │ condition        │   │   │ amenities        │  │
│ created_at   │  │    │ images[]         │   │   │ images[]         │  │
└──────────────┘  │    │ status           │   │   │ preferences      │  │
                  │    │ location         │   │   │ status           │  │
                  │    │ created_at       │   │   │ created_at       │  │
                  │    └──────────────────┘   │   └──────────────────┘  │
                  │                           │                          │
                  │    ┌──────────────────┐   │   ┌──────────────────┐  │
                  │    │ roommate_profiles│   │   │   conversations  │  │
                  │    ├──────────────────┤   │   ├──────────────────┤  │
                  ├───►│ user_id (FK)     │   │   │ id               │  │
                  │    │ budget_range     │   │   │ participant_ids[]│◄─┘
                  │    │ move_in_date     │   └──►│ listing_id (FK)  │
                  │    │ preferences      │       │ created_at       │
                  │    │ lifestyle        │       └────────┬─────────┘
                  │    │ location_pref    │                │
                  │    │ status           │                │
                  │    └──────────────────┘                ▼
                  │                               ┌──────────────────┐
                  │                               │    messages      │
                  │                               ├──────────────────┤
                  │                               │ id               │
                  └──────────────────────────────►│ sender_id (FK)   │
                                                  │ conversation_id  │
                                                  │ content          │
                                                  │ read_at          │
                                                  │ created_at       │
                                                  └──────────────────┘

Additional tables:
  • favorites (user_id, listing_id, created_at)
  • reports (reporter_id, target_type, target_id, reason)
  • notifications (user_id, type, payload, read_at)
```

---

## 10. Security Considerations

### Authentication & Authorization

| Layer | Control |
|-------|---------|
| **Middleware** | Session validation, route protection, token refresh |
| **Server Actions** | `getUser()` check before every mutation |
| **RLS (Row Level Security)** | Database-level enforcement — even if app logic is bypassed |
| **Zod Validation** | Input sanitization at every entry point |

### RLS Policy Examples

```sql
-- Users can only read their own messages
CREATE POLICY "Users read own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = ANY(
      SELECT unnest(participant_ids) FROM conversations
      WHERE id = messages.conversation_id
    )
  );

-- Users can only update their own listings
CREATE POLICY "Owner updates listing" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);
```

### Input Security

- **Zod schemas** validate all inputs (server actions + API routes)
- **File type validation** — MIME type + magic bytes check on uploads
- **Rate limiting** — Supabase Edge Functions or Vercel middleware
- **CSRF** — Built-in with Server Actions (origin check)
- **XSS** — React's default escaping + CSP headers

### Data Privacy

- Phone numbers encrypted at rest, only shown after mutual match
- Location stored as city-level (not precise coordinates) in public views
- Soft deletes for audit trail
- GDPR: user data export & deletion via account settings

### Infrastructure Security

- Environment variables validated with Zod at build time (`config/env.ts`)
- Service role key **never** exposed to client
- Supabase anon key is safe (RLS protects data)
- HTTP-only, Secure, SameSite=Lax cookies for auth tokens

---

## 11. Scalability Plan

### Phase 1: MVP (Current)

```
Vercel (Hobby/Pro)  ←→  Supabase (Free/Pro)
     │
     └── Single region, single project
         • Handles ~1,000 DAU comfortably
         • Supabase Pro: 8GB DB, 250GB bandwidth
```

### Phase 2: Growth (1K–50K DAU)

| Concern | Solution |
|---------|----------|
| **DB Performance** | Add indexes, connection pooling (Supavisor), read replicas |
| **Image CDN** | Supabase CDN + Vercel Image Optimization |
| **Search** | Migrate heavy search to Supabase `pg_trgm` + materialized views |
| **Caching** | React Query stale times, ISR for listing pages, CDN caching |
| **Monitoring** | Vercel Analytics, Supabase Dashboard, Sentry error tracking |

### Phase 3: Scale (50K+ DAU)

| Concern | Solution |
|---------|----------|
| **Multi-region** | Supabase read replicas in target regions |
| **Background jobs** | Supabase Edge Functions (email, notifications, image processing) |
| **Search** | Extract to dedicated search (Meilisearch/Typesense) |
| **Payments** | Stripe integration for premium listings / featured placements |
| **Mobile** | React Native app sharing feature modules via shared package |
| **Microservices** | Extract messaging into standalone service if needed |

### Code Scalability

| Pattern | Benefit |
|---------|---------|
| Feature-based architecture | Teams can own features independently |
| Strict import boundaries | No spaghetti dependencies |
| Generated DB types | Schema changes propagate via `supabase gen types` |
| Zod schemas as source of truth | Shared between client validation & server validation |
| React Query | Client cache layer decouples UI from data fetching strategy |

### Performance Budget

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Bundle (per route) | < 100KB gzipped |
| Time to Interactive | < 3.5s on 4G |

---

## 12. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Server Actions over API routes** | Colocation with UI, type safety, built-in CSRF, progressive enhancement |
| **React Query on client** | Optimistic updates, cache invalidation, infinite scroll, offline support |
| **Feature-based folders** | Scalable team ownership, clear boundaries, easy to find code |
| **Supabase RLS as last defense** | Even if app code has bugs, data stays protected |
| **No ORM (direct Supabase client)** | Less abstraction, better DX with generated types, RLS works natively |
| **Zod for all boundaries** | Single validation library for forms, server actions, env vars, API responses |
| **Route groups `(auth)` / `(platform)`** | Separate layouts without URL nesting |
| **`shared/` not `components/`** | Prevents "components" from becoming a dumping ground |

---

## 13. Development Workflow

```
1. Define DB schema in Supabase Dashboard / migrations
2. Run `supabase gen types typescript` → updates database.types.ts
3. Create Zod schema for the feature
4. Build server query (features/X/queries/)
5. Build server action (features/X/actions/)
6. Build UI components (features/X/components/)
7. Wire into page (app/(platform)/X/page.tsx)
8. Add RLS policies for new tables
9. Test with different auth states
```

---

## Summary

This architecture gives MoveMate:

- **Type safety** end-to-end (DB → Zod → Server → Client)
- **Security by default** (RLS + middleware + validation at every layer)
- **Performance** (RSC streaming, React Query caching, image optimization)
- **Developer experience** (feature isolation, generated types, clear patterns)
- **Scalability path** (from solo dev to multi-team without rewrite)
