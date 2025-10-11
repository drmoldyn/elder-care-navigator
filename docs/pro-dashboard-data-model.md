# Professional Dashboard Data Model (Draft)

## Core Tables

### `pro_clients`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | References `facility_accounts` or future `pro_accounts` table |
| `care_recipient_name` | `text` | Optional (initials allowed) |
| `relationship` | `text` | e.g., adult_child, spouse |
| `primary_condition` | `text` | Align with `RESOURCE_CONDITIONS` |
| `zip_code` | `text` | For localized searches |
| `notes` | `text` | Freeform |
| `created_at`/`updated_at` | `timestamptz` | Audit stamps |

### `pro_tasks`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `client_id` | `uuid` | References `pro_clients` |
| `title` | `text` | Short task description |
| `due_at` | `timestamptz` | Next follow-up |
| `status` | `text` | todo / in_progress / done |
| `assigned_to` | `uuid` | References pro user (future table) |

### `pro_saved_matches`
Stores matched facility snapshots for quick recall.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `client_id` | `uuid` | References `pro_clients` |
| `facility_id` | `uuid` | References `resources` |
| `session_id` | `uuid` | Original match session |
| `rank` | `text` | top / recommended / nice_to_have |
| `notes` | `text` | Coordinator comments |
| `created_at` | `timestamptz` | |

### `pro_activity_log`
Chronological audit trail combining notes, communications, and status changes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `client_id` | `uuid` | References `pro_clients` |
| `activity_type` | `text` | note / call / email / placement |
| `details` | `jsonb` | Structured payload |
| `created_by` | `uuid` | References pro user |
| `created_at` | `timestamptz` | |

## Entitlement Concept

Introduce `pro_accounts` to manage seat licensing:
- `pro_accounts` (org-level metadata, plan tier, billing customer id)
- `pro_members` (user-level access, role)
- `pro_account_features` (feature flags for add-ons)

## Next Steps

1. Migrate schema after portal auth decisions finalize.
2. Build API routes for clients/tasks once Supabase RLS policies are defined.
3. Connect `/pro` dashboard components to these tables.
