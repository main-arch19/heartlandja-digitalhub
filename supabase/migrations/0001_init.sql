-- =============================================================================
-- Heartland JA — initial schema
--
-- Parish publishing platform for Clarendon, Jamaica.
-- Three layers: quarterly magazine, weekly news, paid business directory.
--
-- Design notes that matter:
--   * `listing_events` has no IP column, so a raw IP cannot be stored by
--     accident. Deduplication uses a salted session hash instead.
--   * Row Level Security is enabled on every table. A business owner can never
--     read another business's metrics — that is enforced here, in the database,
--     not in application code.
--   * Content bodies are Tiptap JSON documents stored as JSONB and rendered to
--     HTML on the server.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =============================================================================
-- Enums
-- =============================================================================

create type user_role as enum ('admin', 'editor', 'contributor', 'business_owner');

create type content_status as enum ('draft', 'scheduled', 'published', 'archived');

create type business_status as enum ('enquiry', 'pending', 'active', 'expired', 'suspended');

create type listing_event_type as enum ('view', 'phone_tap', 'directions', 'whatsapp', 'website_click');

create type news_category as enum (
  'council_decisions',
  'school_results',
  'community_events',
  'sports_results',
  'road_works',
  'business_openings',
  'obituaries'
);

create type payment_status as enum ('unpaid', 'invoiced', 'paid', 'refunded', 'waived');

create type payment_method as enum ('cash', 'bank_transfer', 'cheque', 'card', 'online', 'other');

create type ad_status as enum ('draft', 'scheduled', 'active', 'paused', 'ended');

create type ad_event_type as enum ('impression', 'click');

-- =============================================================================
-- Utility: updated_at trigger
-- =============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- profiles — one row per auth user, carries the role
-- =============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'contributor',
  full_name text,
  email citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER so they can read `profiles` without recursing through that
-- table's own RLS policies (a classic Supabase footgun: a policy on profiles
-- that queries profiles will deadlock or infinitely recurse).
-- -----------------------------------------------------------------------------

create or replace function current_role_name()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_role_name() = 'admin', false);
$$;

create or replace function is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_role_name() in ('admin', 'editor'), false);
$$;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_role_name() in ('admin', 'editor', 'contributor'), false);
$$;

-- =============================================================================
-- Content taxonomy — the five editorial subject areas
-- =============================================================================

create table sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  seo_copy jsonb,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sections_updated_at before update on sections
  for each row execute function set_updated_at();

-- =============================================================================
-- authors
-- =============================================================================

create table authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  bio text,
  photo_url text,
  contributor_rights_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger authors_updated_at before update on authors
  for each row execute function set_updated_at();

create index authors_user_id_idx on authors(user_id);

-- =============================================================================
-- issues — quarterly magazine
-- =============================================================================

create table issues (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  title text not null,
  slug text not null unique,
  cover_image_url text,
  description text,
  publish_date date,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger issues_updated_at before update on issues
  for each row execute function set_updated_at();

create index issues_status_publish_idx on issues(status, publish_date desc);

-- =============================================================================
-- articles — belongs to an issue OR standalone
-- =============================================================================

create table articles (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete set null,
  section_id uuid not null references sections(id) on delete restrict,
  author_id uuid references authors(id) on delete set null,
  title text not null,
  slug text not null,
  excerpt text,
  body jsonb,
  hero_image_url text,
  hero_image_alt text,
  publish_date timestamptz,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Slug must be unique within an issue; standalone articles share a namespace.
  unique (issue_id, slug)
);

create trigger articles_updated_at before update on articles
  for each row execute function set_updated_at();

create index articles_status_publish_idx on articles(status, publish_date desc);
create index articles_section_idx on articles(section_id);
create index articles_issue_idx on articles(issue_id);
create index articles_author_idx on articles(author_id);

-- =============================================================================
-- news_posts — the weekly engine
-- =============================================================================

create table news_posts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete restrict,
  author_id uuid references authors(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body jsonb,
  category news_category not null,
  hero_image_url text,
  hero_image_alt text,
  town text,
  publish_date timestamptz,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger news_posts_updated_at before update on news_posts
  for each row execute function set_updated_at();

create index news_posts_status_publish_idx on news_posts(status, publish_date desc);
create index news_posts_category_idx on news_posts(category);
create index news_posts_town_idx on news_posts(town);
create index news_posts_section_idx on news_posts(section_id);

-- =============================================================================
-- history_entries — evergreen cornerstone content
--
-- Distinct from news_posts on purpose: history does not decay, is not
-- date-ordered on the front end, and is written once to rank permanently.
-- =============================================================================

create table history_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references authors(id) on delete set null,
  title text not null,
  slug text not null unique,
  body jsonb,
  excerpt text,
  era text,
  place text,
  hero_image_url text,
  hero_image_alt text,
  source_notes text,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger history_entries_updated_at before update on history_entries
  for each row execute function set_updated_at();

create index history_entries_era_idx on history_entries(era);
create index history_entries_place_idx on history_entries(place);
create index history_entries_status_idx on history_entries(status);

-- =============================================================================
-- episodes — podcast, driven by host RSS
-- =============================================================================

create table episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  audio_url text not null,
  duration_seconds int,
  publish_date timestamptz,
  news_post_id uuid references news_posts(id) on delete set null,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger episodes_updated_at before update on episodes
  for each row execute function set_updated_at();

create index episodes_status_publish_idx on episodes(status, publish_date desc);

-- =============================================================================
-- Directory — the revenue layer
-- =============================================================================

create table business_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references business_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  seo_copy jsonb,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger business_categories_updated_at before update on business_categories
  for each row execute function set_updated_at();

create index business_categories_parent_idx on business_categories(parent_id);

create table listing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_jmd numeric(10, 2) not null default 0,
  term_months int not null default 12,
  description text,
  max_gallery_images int not null default 0,
  featured_placement boolean not null default false,
  category_cap int not null default 1,
  show_website_link boolean not null default false,
  show_whatsapp boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listing_tiers_updated_at before update on listing_tiers
  for each row execute function set_updated_at();

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  category_id uuid not null references business_categories(id) on delete restrict,
  tier_id uuid not null references listing_tiers(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  body jsonb,
  address text,
  town text not null,
  parish text not null default 'Clarendon',
  lat numeric(9, 6),
  lng numeric(9, 6),
  phone text,
  whatsapp text,
  email citext,
  website text,
  hours jsonb,
  logo_url text,
  gallery jsonb not null default '[]'::jsonb,
  status business_status not null default 'pending',
  listing_start date,
  listing_expiry date,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger businesses_updated_at before update on businesses
  for each row execute function set_updated_at();

create index businesses_status_idx on businesses(status);
create index businesses_category_idx on businesses(category_id);
create index businesses_town_idx on businesses(town);
create index businesses_owner_idx on businesses(owner_user_id);
create index businesses_expiry_idx on businesses(listing_expiry)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- Owners may edit their own listing, but must not be able to grant themselves a
-- better tier, flip their own status to active, or extend their own expiry.
-- RLS alone cannot express "these specific columns are read-only", so a trigger
-- enforces it. Admins bypass.
-- -----------------------------------------------------------------------------

create or replace function guard_business_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.tier_id is distinct from old.tier_id
     or new.status is distinct from old.status
     or new.listing_start is distinct from old.listing_start
     or new.listing_expiry is distinct from old.listing_expiry
     or new.owner_user_id is distinct from old.owner_user_id
     or new.slug is distinct from old.slug then
    raise exception
      'Tier, status, listing dates, ownership and slug can only be changed by an administrator.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger businesses_guard_privileged
  before update on businesses
  for each row execute function guard_business_privileged_columns();

-- -----------------------------------------------------------------------------
-- listing_events — append-only measurement.
--
-- No IP column exists by design. `session_hash` is derived server-side from a
-- salted, rotating cookie value; `user_agent_hash` is a truncated SHA-256.
-- -----------------------------------------------------------------------------

create table listing_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  event_type listing_event_type not null,
  occurred_at timestamptz not null default now(),
  referrer text,
  user_agent_hash text,
  session_hash text,
  -- Generated day bucket so the dedupe index below is immutable-safe.
  occurred_on date generated always as ((occurred_at at time zone 'UTC')::date) stored
);

-- One visitor tapping the phone five times in a day is one lead, not five.
create unique index listing_events_dedupe_idx
  on listing_events (business_id, event_type, session_hash, occurred_on)
  where session_hash is not null;

create index listing_events_business_time_idx
  on listing_events (business_id, occurred_at desc);

create index listing_events_type_time_idx
  on listing_events (event_type, occurred_at desc);

-- =============================================================================
-- payments — offline/manual at launch, isolated behind lib/payments
-- =============================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  amount_jmd numeric(10, 2) not null default 0,
  term_months int not null default 12,
  status payment_status not null default 'unpaid',
  method payment_method,
  reference text,
  invoiced_at date,
  paid_at date,
  period_start date,
  period_end date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();

create index payments_business_idx on payments(business_id);
create index payments_status_idx on payments(status);

-- =============================================================================
-- Advertising — schema only in Phase 1/2; rendering lands in Phase 5
-- =============================================================================

create table ad_slots (
  id uuid primary key default gen_random_uuid(),
  placement_key text not null unique,
  name text not null,
  width int not null,
  height int not null,
  page_type text not null,
  created_at timestamptz not null default now()
);

create table ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references ad_slots(id) on delete cascade,
  advertiser_name text not null,
  creative_url text,
  creative_alt text,
  target_url text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status ad_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ad_campaigns_updated_at before update on ad_campaigns
  for each row execute function set_updated_at();

create index ad_campaigns_slot_idx on ad_campaigns(slot_id);
create index ad_campaigns_status_idx on ad_campaigns(status);

create table ad_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references ad_campaigns(id) on delete cascade,
  event_type ad_event_type not null,
  occurred_at timestamptz not null default now(),
  session_hash text
);

create index ad_events_campaign_time_idx on ad_events(campaign_id, occurred_at desc);

-- =============================================================================
-- Platform
-- =============================================================================

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  confirmed_at timestamptz,
  source text,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table town_copy (
  id uuid primary key default gen_random_uuid(),
  town text not null unique,
  slug text not null unique,
  intro jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger town_copy_updated_at before update on town_copy
  for each row execute function set_updated_at();

-- =============================================================================
-- Row Level Security
--
-- Enabled on every table. Public read is limited to published content and
-- active listings. Everything else requires a role.
-- =============================================================================

alter table profiles            enable row level security;
alter table sections            enable row level security;
alter table authors             enable row level security;
alter table issues              enable row level security;
alter table articles            enable row level security;
alter table news_posts          enable row level security;
alter table history_entries     enable row level security;
alter table episodes            enable row level security;
alter table business_categories enable row level security;
alter table listing_tiers       enable row level security;
alter table businesses          enable row level security;
alter table listing_events      enable row level security;
alter table payments            enable row level security;
alter table ad_slots            enable row level security;
alter table ad_campaigns        enable row level security;
alter table ad_events           enable row level security;
alter table subscribers         enable row level security;
alter table town_copy           enable row level security;

-- --- profiles ---------------------------------------------------------------

create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());

create policy profiles_self_update on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- --- taxonomy: public read, staff write ------------------------------------

create policy sections_public_read on sections
  for select using (true);

create policy sections_editor_write on sections
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy authors_public_read on authors
  for select using (true);

create policy authors_editor_write on authors
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy authors_self_update on authors
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- content: public reads published only -----------------------------------

create policy issues_public_read on issues
  for select using (status = 'published' or is_staff());

create policy issues_editor_write on issues
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy articles_public_read on articles
  for select using (status = 'published' or is_staff());

create policy articles_editor_write on articles
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- A contributor owns their own drafts only, and loses write access once the
-- piece leaves draft — publishing is an editor's decision.
create policy articles_contributor_write on articles
  for all
  using (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  )
  with check (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  );

create policy news_public_read on news_posts
  for select using (status = 'published' or is_staff());

create policy news_editor_write on news_posts
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy news_contributor_write on news_posts
  for all
  using (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  )
  with check (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  );

create policy history_public_read on history_entries
  for select using (status = 'published' or is_staff());

create policy history_editor_write on history_entries
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy history_contributor_write on history_entries
  for all
  using (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  )
  with check (
    current_role_name() = 'contributor'
    and status = 'draft'
    and author_id in (select id from authors where user_id = auth.uid())
  );

create policy episodes_public_read on episodes
  for select using (status = 'published' or is_staff());

create policy episodes_editor_write on episodes
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- --- directory --------------------------------------------------------------

create policy business_categories_public_read on business_categories
  for select using (true);

create policy business_categories_editor_write on business_categories
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

create policy listing_tiers_public_read on listing_tiers
  for select using (true);

create policy listing_tiers_admin_write on listing_tiers
  for all using (is_admin()) with check (is_admin());

create policy town_copy_public_read on town_copy
  for select using (true);

create policy town_copy_editor_write on town_copy
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- Public sees active listings. Owners see their own in any state. Admin sees all.
create policy businesses_public_read on businesses
  for select using (
    status = 'active'
    or owner_user_id = auth.uid()
    or is_editor_or_admin()
  );

create policy businesses_admin_write on businesses
  for all using (is_admin()) with check (is_admin());

-- Owners update their own row; the guard trigger blocks privileged columns.
create policy businesses_owner_update on businesses
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- --- listing_events: the isolation guarantee --------------------------------
--
-- Anyone may INSERT (that is how tracking works), but nobody may SELECT except
-- the owning business and admin. There is deliberately no UPDATE or DELETE
-- policy at all, which makes the table append-only for every non-service role.

create policy listing_events_public_insert on listing_events
  for insert to anon, authenticated
  with check (true);

create policy listing_events_owner_read on listing_events
  for select using (
    is_admin()
    or business_id in (
      select id from businesses where owner_user_id = auth.uid()
    )
  );

-- --- payments: admin only. An owner must not see the money table. -----------

create policy payments_admin_all on payments
  for all using (is_admin()) with check (is_admin());

-- --- advertising ------------------------------------------------------------

create policy ad_slots_public_read on ad_slots
  for select using (true);

create policy ad_slots_admin_write on ad_slots
  for all using (is_admin()) with check (is_admin());

create policy ad_campaigns_public_read on ad_campaigns
  for select using (status = 'active' or is_admin());

create policy ad_campaigns_admin_write on ad_campaigns
  for all using (is_admin()) with check (is_admin());

create policy ad_events_public_insert on ad_events
  for insert to anon, authenticated with check (true);

create policy ad_events_admin_read on ad_events
  for select using (is_admin());

-- --- subscribers ------------------------------------------------------------
--
-- Anyone may subscribe. Only admin may read the list.

create policy subscribers_public_insert on subscribers
  for insert to anon, authenticated with check (true);

create policy subscribers_admin_read on subscribers
  for select using (is_admin());

create policy subscribers_admin_write on subscribers
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- Metrics RPCs
--
-- SECURITY DEFINER with an explicit ownership check inside. This is what the
-- business owner portal calls. An owner passing another business's id gets an
-- exception, not data.
-- =============================================================================

create or replace function assert_can_read_business(p_business_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return;
  end if;

  if not exists (
    select 1 from businesses
    where id = p_business_id and owner_user_id = auth.uid()
  ) then
    raise exception 'Not authorised to read metrics for this listing.'
      using errcode = '42501';
  end if;
end;
$$;

-- Totals per event type for a window, alongside the category average so the
-- number has meaning to the owner.
create or replace function business_metrics_totals(
  p_business_id uuid,
  p_days int default 30
)
returns table (
  event_type listing_event_type,
  total bigint,
  category_average numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_category uuid;
  v_since timestamptz := now() - make_interval(days => p_days);
begin
  perform assert_can_read_business(p_business_id);

  select category_id into v_category from businesses where id = p_business_id;

  return query
  with types as (
    select unnest(enum_range(null::listing_event_type)) as event_type
  ),
  mine as (
    select le.event_type, count(*)::bigint as total
    from listing_events le
    where le.business_id = p_business_id
      and le.occurred_at >= v_since
    group by le.event_type
  ),
  peers as (
    select le.event_type, count(*)::numeric / nullif(count(distinct b.id), 0) as avg_total
    from listing_events le
    join businesses b on b.id = le.business_id
    where b.category_id = v_category
      and b.status = 'active'
      and le.occurred_at >= v_since
    group by le.event_type
  )
  select
    t.event_type,
    coalesce(m.total, 0)::bigint,
    round(coalesce(p.avg_total, 0), 1)
  from types t
  left join mine m on m.event_type = t.event_type
  left join peers p on p.event_type = t.event_type
  order by t.event_type;
end;
$$;

-- Daily series for the sparkline. Zero-filled so the trend line has no gaps.
create or replace function business_metrics_series(
  p_business_id uuid,
  p_days int default 30
)
returns table (
  day date,
  event_type listing_event_type,
  count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform assert_can_read_business(p_business_id);

  return query
  with days as (
    select generate_series(
      (now() - make_interval(days => p_days - 1))::date,
      now()::date,
      interval '1 day'
    )::date as day
  ),
  types as (
    select unnest(enum_range(null::listing_event_type)) as event_type
  ),
  grid as (
    select d.day, t.event_type from days d cross join types t
  ),
  counted as (
    select le.occurred_on as day, le.event_type, count(*)::bigint as count
    from listing_events le
    where le.business_id = p_business_id
      and le.occurred_on >= (now() - make_interval(days => p_days - 1))::date
    group by le.occurred_on, le.event_type
  )
  select g.day, g.event_type, coalesce(c.count, 0)::bigint
  from grid g
  left join counted c on c.day = g.day and c.event_type = g.event_type
  order by g.day, g.event_type;
end;
$$;

revoke all on function business_metrics_totals(uuid, int) from public;
revoke all on function business_metrics_series(uuid, int) from public;
grant execute on function business_metrics_totals(uuid, int) to authenticated;
grant execute on function business_metrics_series(uuid, int) to authenticated;
