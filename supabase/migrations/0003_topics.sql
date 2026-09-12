-- =============================================================================
-- 0003 — topics
--
-- A topic is the subject a story is *about*, which is not the same as either of
-- the two axes news_posts already carries:
--
--   category  a fixed 7-value enum, the KIND of story (road works, obituary)
--   town      where it happened
--   topic     what it concerns — "Denbigh Show", "Clarendon Cricket"
--
-- Topics are a join rather than a text column on news_posts, unlike the
-- free-text era/place axes on history_entries. A story genuinely has several:
-- a report on the Denbigh show is the Denbigh Show AND Agriculture AND May Pen.
-- One column would force a false choice, and a topic page that silently misses
-- half its stories is worse than no topic page at all. The join also gives the
-- related-topics strip real co-occurrence data to score against.
-- =============================================================================

-- Kind drives grouping on /topics and nothing else. Deliberately a check
-- constraint rather than a Postgres enum: adding a kind should not need a
-- migration that rewrites a type other tables depend on.
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'subject'
    check (kind in ('subject', 'place', 'person', 'event')),
  description text,
  -- Editorial intro shown at the top of the topic page, same role as
  -- town_copy.intro: it lets a topic page rank on real prose before it has
  -- accumulated many stories.
  intro jsonb,
  -- Drives the "In the parish now" bar. Editor-chosen, not measured — nothing
  -- counts news views yet, so nothing here claims to be trending.
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger topics_updated_at before update on topics
  for each row execute function set_updated_at();

create table news_post_topics (
  news_post_id uuid not null references news_posts(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  primary key (news_post_id, topic_id)
);

-- The primary key already indexes (news_post_id, topic_id), which serves
-- "topics for this post". The reverse lookup — "posts for this topic", the
-- query every topic page runs — needs its own index.
create index news_post_topics_topic_idx on news_post_topics (topic_id);

create index topics_featured_idx on topics (sort_order) where featured;

-- =============================================================================
-- RLS
-- =============================================================================

alter table topics enable row level security;
alter table news_post_topics enable row level security;

-- Topics are taxonomy, not content: they carry no status column, so there is no
-- draft state to hide. Same policy pair as sections and town_copy.
create policy topics_public_read on topics
  for select using (true);

create policy topics_editor_write on topics
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- Tagging follows the same rule. A contributor cannot reach this table
-- directly; their own draft is tagged through the editor, which writes as the
-- post is saved. Read is public so a published story can show its topics
-- without an authenticated session.
create policy news_post_topics_public_read on news_post_topics
  for select using (true);

create policy news_post_topics_editor_write on news_post_topics
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());
