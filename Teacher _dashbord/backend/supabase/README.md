# SSGMCE Teacher Dashboard - Supabase Setup & Architecture

This directory houses the PostgreSQL schema, Row Level Security (RLS) policies, database triggers, seed data, and Edge Functions for the **SSGMCE Teacher Dashboard ERP**.

---

## 📁 Structure

- `migrations/`:
  - `20250101000000_init_schema.sql` - Core table definitions (13 relational entities)
  - `20250101000001_rls_policies.sql` - Comprehensive Row Level Security policies
  - `20250101000002_functions_triggers.sql` - Automatic timestamps & counter aggregators
  - `20250101000003_seed_data.sql` - Seed script with SSGMCE faculty, classes, subjects, and roster
  - `20250101000004_indexes_views.sql` - High-performance query indexes and analytical views
- `functions/`:
  - `mark-attendance` - Fast swipe / roster toggle Edge Function
  - `submit-attendance` - Atomic session lock & attendance commit
  - `generate-attendance-report` - Class and date-range attendance analytics
  - `sync-timetable` - Real-time schedule synchronizer
- `seed.sql` - Direct fallback SQL seeding script
- `config.toml` - Supabase CLI configuration

---

## 🚀 Running Locally with Supabase CLI

1. **Install CLI**:
   ```bash
   npm install -g supabase
   ```
2. **Start Supabase Containers**:
   ```bash
   supabase start
   ```
3. **Apply Migrations and Seed**:
   ```bash
   supabase db reset
   ```
4. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy mark-attendance
   supabase functions deploy submit-attendance
   ```
