# MoveMate — Database Schema Design

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              auth.users                                       │
│                         (Supabase managed)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ id (UUID PK) │ email │ encrypted_password │ raw_user_meta_data │ ...│    │
│  └──────────┬──────────────────────────────────────────────────────────┘    │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │
              │ 1:1 (trigger-created)
              ▼
┌──────────────────────────────┐
│         profiles             │
├──────────────────────────────┤
│ id          UUID PK (FK →    │
│              auth.users.id)  │
│ full_name   TEXT NOT NULL    │
│ display_name TEXT             │
│ avatar_url  TEXT             │
│ bio         TEXT (≤500)      │
│ phone       TEXT (regex)     │
│ location    TEXT             │
│ is_verified BOOL             │
│ is_banned   BOOL             │
│ created_at  TIMESTAMPTZ     │
│ updated_at  TIMESTAMPTZ     │
└──────┬───────────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│         listings             │         │      listing_images          │
├──────────────────────────────┤         ├──────────────────────────────┤
│ id          UUID PK          │ 1:N     │ id          UUID PK          │
│ seller_id   UUID FK ─────────│────┐    │ listing_id  UUID FK ─────────│──┐
│ title       TEXT (3-120)     │    │    │ url         TEXT (https)     │  │
│ description TEXT (10-5000)   │    │    │ storage_path TEXT            │  │
│ price       INT (cents)      │    │    │ position    SMALLINT (0-9)  │  │
│ currency    TEXT (AUD)       │    │    │ width       INT             │  │
│ category    ENUM             │    │    │ height      INT             │  │
│ condition   ENUM             │    │    │ size_bytes  INT (≤5MB)      │  │
│ status      ENUM             │    │    │ created_at  TIMESTAMPTZ     │  │
│ location    TEXT             │    │    └──────────────────────────────┘  │
│ latitude    FLOAT            │    │                                      │
│ longitude   FLOAT            │    └──────────────────────────────────────┘
│ is_negotiable BOOL           │
│ is_delivery BOOL             │
│ view_count  INT              │
│ fts         TSVECTOR (gen)   │
│ expires_at  TIMESTAMPTZ      │
│ created_at  TIMESTAMPTZ      │
│ updated_at  TIMESTAMPTZ      │
└──────┬───────────────────────┘
       │
       │ N:M (via junction tables)
       │
       ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│      saved_listings          │         │          reports             │
├──────────────────────────────┤         ├──────────────────────────────┤
│ id          UUID PK          │         │ id            UUID PK        │
│ user_id     UUID FK → profiles│         │ reporter_id   UUID FK →     │
│ listing_id  UUID FK → listings│         │                profiles     │
│ created_at  TIMESTAMPTZ      │         │ target_type   ENUM          │
│                              │         │ target_id     UUID           │
│ UNIQUE(user_id, listing_id)  │         │ reason        ENUM          │
└──────────────────────────────┘         │ description   TEXT (≤2000)  │
                                         │ status        ENUM          │
                                         │ moderator_id  UUID FK →     │
                                         │                profiles     │
                                         │ resolved_at   TIMESTAMPTZ   │
                                         │ created_at    TIMESTAMPTZ   │
                                         │ updated_at    TIMESTAMPTZ   │
                                         │                              │
                                         │ UNIQUE(reporter_id,          │
                                         │   target_type, target_id)    │
                                         └──────────────────────────────┘
```

## Relationships Summary

| Relationship | Type | Constraint |
|---|---|---|
| `auth.users` → `profiles` | 1:1 | `profiles.id` FK → `auth.users.id` ON DELETE CASCADE |
| `profiles` → `listings` | 1:N | `listings.seller_id` FK → `profiles.id` ON DELETE CASCADE |
| `listings` → `listing_images` | 1:N | `listing_images.listing_id` FK → `listings.id` ON DELETE CASCADE |
| `profiles` → `saved_listings` | 1:N | `saved_listings.user_id` FK → `profiles.id` ON DELETE CASCADE |
| `listings` → `saved_listings` | 1:N | `saved_listings.listing_id` FK → `listings.id` ON DELETE CASCADE |
| `profiles` → `reports` (reporter) | 1:N | `reports.reporter_id` FK → `profiles.id` ON DELETE CASCADE |
| `profiles` → `reports` (moderator) | 1:N | `reports.moderator_id` FK → `profiles.id` ON DELETE SET NULL |

## Enum Types

| Type | Values |
|------|--------|
| `listing_status` | draft, active, sold, reserved, expired, removed |
| `listing_category` | sofa, bed, table, chair, desk, storage, lighting, appliance, decor, outdoor, other |
| `listing_condition` | new, like_new, good, fair, poor |
| `report_reason` | spam, scam, inappropriate_content, misleading, duplicate, prohibited_item, harassment, other |
| `report_status` | pending, reviewing, resolved, dismissed |
| `report_target_type` | listing, profile |

## Index Strategy

### Profiles
| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree (unique) | Primary key lookup |
| `idx_profiles_display_name` | `display_name` | B-tree | Name search |
| `idx_profiles_location` | `location` | B-tree | Location filter |
| `idx_profiles_created_at` | `created_at DESC` | B-tree | Recent users |

### Listings
| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree (unique) | Primary key lookup |
| `idx_listings_seller_id` | `seller_id` | B-tree | User's listings |
| `idx_listings_status` | `status` (partial: active) | B-tree | Active listings filter |
| `idx_listings_category` | `category` | B-tree | Category filter |
| `idx_listings_price` | `price` | B-tree | Price range queries |
| `idx_listings_location` | `location` | B-tree | Location filter |
| `idx_listings_created_at` | `created_at DESC` | B-tree | Recent listings |
| `idx_listings_expires_at` | `expires_at` (partial: active) | B-tree | Expiry cleanup |
| `idx_listings_active_category_price` | `category, price` (partial) | B-tree | Filtered browse |
| `idx_listings_active_location_category` | `location, category` (partial) | B-tree | Local browse |
| `idx_listings_fts` | `fts` | GIN | Full-text search |

### Listing Images
| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree (unique) | Primary key lookup |
| `idx_listing_images_listing_id` | `listing_id` | B-tree | Fetch images for listing |
| `idx_listing_images_position` | `listing_id, position` | B-tree | Ordered image retrieval |

### Saved Listings
| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree (unique) | Primary key lookup |
| `idx_saved_listings_user_id` | `user_id` | B-tree | User's favorites |
| `idx_saved_listings_listing_id` | `listing_id` | B-tree | Listing save count |
| `idx_saved_listings_created_at` | `user_id, created_at DESC` | B-tree | Recent saves |

### Reports
| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree (unique) | Primary key lookup |
| `idx_reports_reporter_id` | `reporter_id` | B-tree | User's reports |
| `idx_reports_target` | `target_type, target_id` | B-tree | Reports on a target |
| `idx_reports_status` | `status` (partial: pending/reviewing) | B-tree | Moderation queue |
| `idx_reports_created_at` | `created_at DESC` | B-tree | Recent reports |

## Constraints Summary

| Table | Constraint | Type | Rule |
|-------|-----------|------|------|
| profiles | PK | Primary Key | `id` |
| profiles | FK | Foreign Key | `id` → `auth.users.id` CASCADE |
| profiles | CHECK | Validation | `bio` ≤ 500 chars |
| profiles | CHECK | Validation | `phone` matches E.164 pattern |
| listings | PK | Primary Key | `id` |
| listings | FK | Foreign Key | `seller_id` → `profiles.id` CASCADE |
| listings | CHECK | Validation | `title` 3–120 chars |
| listings | CHECK | Validation | `description` 10–5000 chars |
| listings | CHECK | Validation | `price` 0–10,000,000 (cents) |
| listings | CHECK | Validation | `currency` is 3 uppercase letters |
| listings | CHECK | Validation | `latitude` between -90 and 90 |
| listings | CHECK | Validation | `longitude` between -180 and 180 |
| listing_images | PK | Primary Key | `id` |
| listing_images | FK | Foreign Key | `listing_id` → `listings.id` CASCADE |
| listing_images | UNIQUE | Uniqueness | `(listing_id, position)` |
| listing_images | CHECK | Validation | `url` starts with http(s) |
| listing_images | CHECK | Validation | `position` 0–9 (max 10 images) |
| listing_images | CHECK | Validation | `size_bytes` ≤ 5MB |
| saved_listings | PK | Primary Key | `id` |
| saved_listings | FK | Foreign Key | `user_id` → `profiles.id` CASCADE |
| saved_listings | FK | Foreign Key | `listing_id` → `listings.id` CASCADE |
| saved_listings | UNIQUE | Uniqueness | `(user_id, listing_id)` |
| reports | PK | Primary Key | `id` |
| reports | FK | Foreign Key | `reporter_id` → `profiles.id` CASCADE |
| reports | FK | Foreign Key | `moderator_id` → `profiles.id` SET NULL |
| reports | UNIQUE | Uniqueness | `(reporter_id, target_type, target_id)` |
| reports | CHECK | Validation | `description` ≤ 2000 chars |

## RLS Strategy

### Design Principles

1. **Deny by default** — RLS enabled on all tables, no access without explicit policy
2. **Least privilege** — Users get minimum access needed for their role
3. **Ownership-based** — Users can only mutate their own data
4. **Public reads where appropriate** — Profiles and active listings are public
5. **Admin via service role** — Moderation bypasses RLS using `service_role` key (server-only)

### Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **profiles** | Everyone | System trigger (own `id`) | Own profile only | N/A (cascade from auth) |
| **listings** | Active + own drafts | Own `seller_id` | Own listings | Own listings |
| **listing_images** | Via listing visibility | Own listing's images | Own listing's images | Own listing's images |
| **saved_listings** | Own saves only | Own `user_id` | N/A | Own saves only |
| **reports** | Own reports only | Own `reporter_id` | Admin only (service role) | Admin only (service role) |
| **conversations** | Buyer or seller | Own `buyer_id`, `seller_id` = listing owner | None | None |
| **messages** | Conversation participants | Participant, own `sender_id` | `read_at` only, via `mark_conversation_read()` | None |

### Security Notes

- **Cascading deletes**: If a user is deleted from `auth.users`, all their data is automatically cleaned up
- **Service role bypass**: Admin operations (ban user, resolve report, remove listing) use the service role client which bypasses RLS
- **No direct profile deletion**: Users request account deletion → triggers `auth.users` delete → cascades
- **View count**: Incremented via `SECURITY DEFINER` function to prevent arbitrary manipulation
- **Storage paths**: Enforced to include `user_id` prefix, preventing cross-user file access

## Messaging (`00010_messaging.sql`)

Buyer ↔ seller chat about a `user_listings` row (the map listings).

| Table | Columns |
|-------|---------|
| **conversations** | `id`, `listing_id` → `user_listings` (SET NULL), `buyer_id` / `seller_id` → `auth.users` (SET NULL), `created_at`, `updated_at` |
| **messages** | `id`, `conversation_id` → `conversations` (CASCADE), `sender_id` → `auth.users` (SET NULL), `content` (1–2000 chars), `created_at`, `read_at` |

- **One conversation per buyer per listing**: `UNIQUE (listing_id, buyer_id)`; the seller is derived from the listing, so this also covers buyer + seller + listing
- **History survives deletes**: deleting a listing or user nulls the reference instead of deleting the conversation
- **Server-owned fields**: triggers set `created_at`, clear `read_at` and trim `content` on insert, and bump `conversations.updated_at` on each message
- **RPCs**: `get_my_conversations()` (inbox with last message and unread count), `get_unread_message_count()` (nav badge), `mark_conversation_read(uuid)`
- **Realtime**: `messages` is in the `supabase_realtime` publication; the SELECT policy limits events to participants

## Migration File

The production-ready SQL migration is located at:

```
supabase/migrations/00001_initial_schema.sql
```

Run with:
```bash
supabase db push        # Push to remote
supabase db reset       # Reset local (development)
supabase migration up   # Apply pending migrations
```
