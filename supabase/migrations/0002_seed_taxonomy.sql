-- =============================================================================
-- Heartland JA — taxonomy seed
--
-- Idempotent. Safe to re-run. Seeds only structural reference data:
-- the five editorial sections, the directory category tree, and the listing
-- tiers. No fictional businesses are inserted here — those live in
-- `content/seed/` for local development only and must never reach production.
--
-- PRICES BELOW ARE PLACEHOLDERS. Ventley sets the real rate card; prices are
-- stored in the database precisely so they can be changed without a deploy.
-- =============================================================================

-- --- The five editorial subject areas ---------------------------------------
--
-- These are the content taxonomy. Business advertising, social integration,
-- the podcast and the radio stream are platform features, NOT sections.

insert into sections (name, slug, description, sort_order) values
  ('Business & Trade', 'business-trade',
   'Commerce, agriculture, enterprise and the working economy of Clarendon.', 1),
  ('Education', 'education',
   'Schools, students, teachers and achievement across the parish.', 2),
  ('Culture', 'culture',
   'Heritage, music, faith, food and the life of Clarendon''s communities.', 3),
  ('Tourism', 'tourism',
   'Places to visit, attractions, and the parish seen through a visitor''s eyes.', 4),
  ('Sports', 'sports',
   'Clubs, fixtures, results and the athletes carrying the parish name.', 5)
on conflict (slug) do nothing;

-- --- Directory categories ---------------------------------------------------
--
-- Top level first, then children resolved by slug lookup.

insert into business_categories (name, slug, description, sort_order) values
  ('Food & Drink',            'food-drink',            'Restaurants, cook shops, bars and caterers.', 1),
  ('Trades & Home Services',  'trades-home-services',  'Plumbers, electricians, masons, carpenters and repairs.', 2),
  ('Retail & Shopping',       'retail-shopping',       'Shops, hardware, groceries and general merchandise.', 3),
  ('Health & Wellness',       'health-wellness',       'Doctors, pharmacies, dentists and care providers.', 4),
  ('Professional Services',   'professional-services', 'Legal, accounting, insurance and business support.', 5),
  ('Transport & Motoring',    'transport-motoring',    'Taxis, haulage, mechanics and auto parts.', 6),
  ('Agriculture & Farming',   'agriculture-farming',   'Farms, produce, supplies and agricultural services.', 7),
  ('Education & Training',    'education-training',    'Schools, tutors, and vocational training.', 8),
  ('Beauty & Personal Care',  'beauty-personal-care',  'Salons, barbers, spas and personal grooming.', 9),
  ('Construction & Property', 'construction-property', 'Builders, contractors, real estate and rentals.', 10),
  ('Events & Entertainment',  'events-entertainment',  'Venues, DJs, photographers and event services.', 11),
  ('Accommodation',           'accommodation',         'Guest houses, villas and places to stay.', 12)
on conflict (slug) do nothing;

-- A representative set of sub-categories. These are the long-tail programmatic
-- SEO targets — "plumber in May Pen" resolves to one of these.
insert into business_categories (parent_id, name, slug, description, sort_order)
select p.id, v.name, v.slug, v.description, v.sort_order
from (values
  ('trades-home-services', 'Plumbers',            'plumbers',            'Plumbing installation, repairs and emergency callouts.', 1),
  ('trades-home-services', 'Electricians',        'electricians',        'Wiring, installation, inspection and electrical repairs.', 2),
  ('trades-home-services', 'Masons & Builders',   'masons-builders',     'Blockwork, concrete, plastering and general building.', 3),
  ('trades-home-services', 'Carpenters & Joiners','carpenters-joiners',  'Furniture, fittings, roofing and woodwork.', 4),
  ('trades-home-services', 'Welders',             'welders',             'Grilles, gates, fabrication and metalwork.', 5),
  ('food-drink',           'Restaurants',         'restaurants',         'Sit-down dining across the parish.', 1),
  ('food-drink',           'Cook Shops',          'cook-shops',          'Everyday Jamaican cooking, takeaway and lunch.', 2),
  ('food-drink',           'Bars & Lounges',      'bars-lounges',        'Bars, lounges and evening spots.', 3),
  ('food-drink',           'Bakeries',            'bakeries',            'Bread, pastry, cakes and baked goods.', 4),
  ('food-drink',           'Caterers',            'caterers',            'Event catering and food service.', 5),
  ('health-wellness',      'Pharmacies',          'pharmacies',          'Dispensing chemists and pharmacy counters.', 1),
  ('health-wellness',      'Doctors & Clinics',   'doctors-clinics',     'General practice, clinics and medical centres.', 2),
  ('health-wellness',      'Dentists',            'dentists',            'Dental surgeries and orthodontics.', 3),
  ('transport-motoring',   'Mechanics',           'mechanics',           'Vehicle servicing, diagnostics and repairs.', 1),
  ('transport-motoring',   'Taxi & Route Service','taxi-route-service',  'Licensed taxis and route operators.', 2),
  ('transport-motoring',   'Auto Parts',          'auto-parts',          'Spares, tyres, batteries and accessories.', 3),
  ('retail-shopping',      'Hardware Stores',     'hardware-stores',     'Building supplies, tools and materials.', 1),
  ('retail-shopping',      'Supermarkets & Grocery','supermarkets-grocery','Groceries, provisions and household goods.', 2),
  ('beauty-personal-care', 'Hair Salons',         'hair-salons',         'Styling, braiding, colouring and treatments.', 1),
  ('beauty-personal-care', 'Barbers',             'barbers',             'Cuts, shaves and grooming.', 2)
) as v(parent_slug, name, slug, description, sort_order)
join business_categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

-- --- Listing tiers ----------------------------------------------------------
--
-- PLACEHOLDER PRICING. Three tiers is the conventional shape: a free entry to
-- populate the directory at launch (an empty directory sells nothing), and two
-- paid tiers above it.

insert into listing_tiers (
  name, slug, price_jmd, term_months, description,
  max_gallery_images, featured_placement, category_cap,
  show_website_link, show_whatsapp, features, sort_order
) values
  (
    'Basic', 'basic', 0, 12,
    'A free entry so every Clarendon business can be found.',
    0, false, 1, false, false,
    '["Business name, town and category","Phone number","Opening hours","Appears in category and town listings"]'::jsonb,
    1
  ),
  (
    'Standard', 'standard', 12000, 12,
    'A full listing with photographs, WhatsApp and a link to your website.',
    5, false, 2, true, true,
    '["Everything in Basic","Up to 5 photographs","WhatsApp button","Website link","Full business description","Monthly performance report"]'::jsonb,
    2
  ),
  (
    'Featured', 'featured', 30000, 12,
    'Top placement in your category and town, plus placement on the homepage.',
    15, true, 4, true, true,
    '["Everything in Standard","Top of category and town results","Homepage featured placement","Up to 15 photographs","Listed in up to 4 categories","Priority support"]'::jsonb,
    3
  )
on conflict (slug) do nothing;

-- --- Ad slots (defined now, rendered in Phase 5) ----------------------------

insert into ad_slots (placement_key, name, width, height, page_type) values
  ('news_inline',        'News article inline',      728, 90,  'news'),
  ('news_sidebar',       'News sidebar',             300, 250, 'news'),
  ('directory_category', 'Directory category banner',728, 90,  'directory'),
  ('home_leaderboard',   'Homepage leaderboard',     970, 250, 'home')
on conflict (placement_key) do nothing;
