/**
 * ============================================================================
 * DEVELOPMENT SEED DATA — FICTIONAL
 * ============================================================================
 *
 * Every business, person, phone number and address below is INVENTED for local
 * development and demonstration. None of these are real Clarendon businesses.
 * Phone numbers use the 876-555 range, which is not issuable.
 *
 * This data exists so the application runs, renders and can be demonstrated
 * with no Supabase project configured. It is never inserted into a production
 * database — `supabase/migrations/0002_seed_taxonomy.sql` seeds only structural
 * reference data (sections, categories, tiers).
 *
 * The data layer falls back to these arrays when `hasSupabase()` is false.
 * ============================================================================
 */

import type {
  Business,
  BusinessCategory,
  ListingTier,
  NewsPost,
  Section,
  Topic,
  TownCopy,
} from '@/types/db'

const now = '2026-01-15T10:00:00.000Z'

// ---------------------------------------------------------------------------
// Sections — mirrors 0002_seed_taxonomy.sql exactly
// ---------------------------------------------------------------------------

export const seedSections: Section[] = [
  {
    id: 'sec-business',
    name: 'Business & Trade',
    slug: 'business-trade',
    description:
      'Commerce, agriculture, enterprise and the working economy of Clarendon.',
    seo_copy: null,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sec-education',
    name: 'Education',
    slug: 'education',
    description: 'Schools, students, teachers and achievement across the parish.',
    seo_copy: null,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sec-culture',
    name: 'Culture',
    slug: 'culture',
    description:
      "Heritage, music, faith, food and the life of Clarendon's communities.",
    seo_copy: null,
    sort_order: 3,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sec-tourism',
    name: 'Tourism',
    slug: 'tourism',
    description:
      "Places to visit, attractions, and the parish seen through a visitor's eyes.",
    seo_copy: null,
    sort_order: 4,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sec-sports',
    name: 'Sports',
    slug: 'sports',
    description: 'Clubs, fixtures, results and the athletes carrying the parish name.',
    seo_copy: null,
    sort_order: 5,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
]

// ---------------------------------------------------------------------------
// Listing tiers
// ---------------------------------------------------------------------------

export const seedTiers: ListingTier[] = [
  {
    id: 'tier-basic',
    name: 'Basic',
    slug: 'basic',
    price_jmd: 0,
    term_months: 12,
    description: 'A free entry so every Clarendon business can be found.',
    max_gallery_images: 0,
    featured_placement: false,
    category_cap: 1,
    show_website_link: false,
    show_whatsapp: false,
    features: [
      'Business name, town and category',
      'Phone number',
      'Opening hours',
      'Appears in category and town listings',
    ],
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'tier-standard',
    name: 'Standard',
    slug: 'standard',
    price_jmd: 12000,
    term_months: 12,
    description:
      'A full listing with photographs, WhatsApp and a link to your website.',
    max_gallery_images: 5,
    featured_placement: false,
    category_cap: 2,
    show_website_link: true,
    show_whatsapp: true,
    features: [
      'Everything in Basic',
      'Up to 5 photographs',
      'WhatsApp button',
      'Website link',
      'Full business description',
      'Monthly performance report',
    ],
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'tier-featured',
    name: 'Featured',
    slug: 'featured',
    price_jmd: 30000,
    term_months: 12,
    description:
      'Top placement in your category and town, plus placement on the homepage.',
    max_gallery_images: 15,
    featured_placement: true,
    category_cap: 4,
    show_website_link: true,
    show_whatsapp: true,
    features: [
      'Everything in Standard',
      'Top of category and town results',
      'Homepage featured placement',
      'Up to 15 photographs',
      'Listed in up to 4 categories',
      'Priority support',
    ],
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
]

// ---------------------------------------------------------------------------
// Business categories
// ---------------------------------------------------------------------------

function category(
  id: string,
  name: string,
  slug: string,
  description: string,
  sort_order: number,
  parent_id: string | null = null,
): BusinessCategory {
  return {
    id,
    parent_id,
    name,
    slug,
    description,
    seo_copy: null,
    sort_order,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  }
}

export const seedCategories: BusinessCategory[] = [
  category('cat-food', 'Food & Drink', 'food-drink', 'Restaurants, cook shops, bars and caterers.', 1),
  category('cat-trades', 'Trades & Home Services', 'trades-home-services', 'Plumbers, electricians, masons, carpenters and repairs.', 2),
  category('cat-retail', 'Retail & Shopping', 'retail-shopping', 'Shops, hardware, groceries and general merchandise.', 3),
  category('cat-health', 'Health & Wellness', 'health-wellness', 'Doctors, pharmacies, dentists and care providers.', 4),
  category('cat-professional', 'Professional Services', 'professional-services', 'Legal, accounting, insurance and business support.', 5),
  category('cat-transport', 'Transport & Motoring', 'transport-motoring', 'Taxis, haulage, mechanics and auto parts.', 6),
  category('cat-agri', 'Agriculture & Farming', 'agriculture-farming', 'Farms, produce, supplies and agricultural services.', 7),
  category('cat-education', 'Education & Training', 'education-training', 'Schools, tutors, and vocational training.', 8),
  category('cat-beauty', 'Beauty & Personal Care', 'beauty-personal-care', 'Salons, barbers, spas and personal grooming.', 9),
  category('cat-construction', 'Construction & Property', 'construction-property', 'Builders, contractors, real estate and rentals.', 10),
  category('cat-events', 'Events & Entertainment', 'events-entertainment', 'Venues, DJs, photographers and event services.', 11),
  category('cat-accommodation', 'Accommodation', 'accommodation', 'Guest houses, villas and places to stay.', 12),

  // Sub-categories — the long-tail SEO targets.
  category('cat-plumbers', 'Plumbers', 'plumbers', 'Plumbing installation, repairs and emergency callouts.', 1, 'cat-trades'),
  category('cat-electricians', 'Electricians', 'electricians', 'Wiring, installation, inspection and electrical repairs.', 2, 'cat-trades'),
  category('cat-masons', 'Masons & Builders', 'masons-builders', 'Blockwork, concrete, plastering and general building.', 3, 'cat-trades'),
  category('cat-carpenters', 'Carpenters & Joiners', 'carpenters-joiners', 'Furniture, fittings, roofing and woodwork.', 4, 'cat-trades'),
  category('cat-welders', 'Welders', 'welders', 'Grilles, gates, fabrication and metalwork.', 5, 'cat-trades'),
  category('cat-restaurants', 'Restaurants', 'restaurants', 'Sit-down dining across the parish.', 1, 'cat-food'),
  category('cat-cookshops', 'Cook Shops', 'cook-shops', 'Everyday Jamaican cooking, takeaway and lunch.', 2, 'cat-food'),
  category('cat-bars', 'Bars & Lounges', 'bars-lounges', 'Bars, lounges and evening spots.', 3, 'cat-food'),
  category('cat-bakeries', 'Bakeries', 'bakeries', 'Bread, pastry, cakes and baked goods.', 4, 'cat-food'),
  category('cat-caterers', 'Caterers', 'caterers', 'Event catering and food service.', 5, 'cat-food'),
  category('cat-pharmacies', 'Pharmacies', 'pharmacies', 'Dispensing chemists and pharmacy counters.', 1, 'cat-health'),
  category('cat-doctors', 'Doctors & Clinics', 'doctors-clinics', 'General practice, clinics and medical centres.', 2, 'cat-health'),
  category('cat-dentists', 'Dentists', 'dentists', 'Dental surgeries and orthodontics.', 3, 'cat-health'),
  category('cat-mechanics', 'Mechanics', 'mechanics', 'Vehicle servicing, diagnostics and repairs.', 1, 'cat-transport'),
  category('cat-taxi', 'Taxi & Route Service', 'taxi-route-service', 'Licensed taxis and route operators.', 2, 'cat-transport'),
  category('cat-autoparts', 'Auto Parts', 'auto-parts', 'Spares, tyres, batteries and accessories.', 3, 'cat-transport'),
  category('cat-hardware', 'Hardware Stores', 'hardware-stores', 'Building supplies, tools and materials.', 1, 'cat-retail'),
  category('cat-grocery', 'Supermarkets & Grocery', 'supermarkets-grocery', 'Groceries, provisions and household goods.', 2, 'cat-retail'),
  category('cat-salons', 'Hair Salons', 'hair-salons', 'Styling, braiding, colouring and treatments.', 1, 'cat-beauty'),
  category('cat-barbers', 'Barbers', 'barbers', 'Cuts, shaves and grooming.', 2, 'cat-beauty'),
]

// ---------------------------------------------------------------------------
// Businesses — ALL FICTIONAL
// ---------------------------------------------------------------------------

const standardHours = {
  '1': [{ open: '08:00', close: '17:00' }],
  '2': [{ open: '08:00', close: '17:00' }],
  '3': [{ open: '08:00', close: '17:00' }],
  '4': [{ open: '08:00', close: '17:00' }],
  '5': [{ open: '08:00', close: '17:00' }],
  '6': [{ open: '09:00', close: '13:00' }],
  '7': null,
}

function business(input: Partial<Business> & Pick<Business, 'id' | 'name' | 'slug' | 'category_id' | 'town'>): Business {
  return {
    owner_user_id: null,
    tier_id: 'tier-basic',
    description: null,
    body: null,
    address: null,
    parish: 'Clarendon',
    lat: null,
    lng: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    hours: standardHours,
    logo_url: null,
    gallery: [],
    status: 'active',
    listing_start: '2026-01-01',
    listing_expiry: '2026-12-31',
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
    ...input,
  } as Business
}

export const seedBusinesses: Business[] = [
  business({
    id: 'biz-riverside-plumbing',
    name: 'Riverside Plumbing & Supplies',
    slug: 'riverside-plumbing-supplies',
    category_id: 'cat-plumbers',
    tier_id: 'tier-featured',
    town: 'May Pen',
    description:
      'Emergency plumbing, tank installation and pipe repair across central Clarendon. Twenty-two years serving May Pen and surrounding districts.',
    address: '14 Main Street, May Pen',
    lat: 17.9667,
    lng: -77.245,
    phone: '876-555-0142',
    whatsapp: '876-555-0142',
    email: 'info@riversideplumbing.example',
    website: 'https://riversideplumbing.example',
    owner_user_id: 'stub-business_owner',
    gallery: [],
  }),
  business({
    id: 'biz-thompson-electrical',
    name: 'Thompson Electrical Services',
    slug: 'thompson-electrical-services',
    category_id: 'cat-electricians',
    tier_id: 'tier-standard',
    town: 'May Pen',
    description:
      'Licensed electrical installation and inspection for homes and small businesses. JPS-compliant certification provided.',
    address: '7 Sevens Road, May Pen',
    lat: 17.9712,
    lng: -77.2381,
    phone: '876-555-0198',
    whatsapp: '876-555-0198',
    email: 'thompsonelectrical@example.com',
  }),
  business({
    id: 'biz-clarendon-hardware',
    name: 'Clarendon Hardware Depot',
    slug: 'clarendon-hardware-depot',
    category_id: 'cat-hardware',
    tier_id: 'tier-featured',
    town: 'May Pen',
    description:
      'Cement, steel, lumber, tools and plumbing supplies. Bulk pricing for contractors, delivery across the parish.',
    address: '52 Manchester Avenue, May Pen',
    lat: 17.9634,
    lng: -77.2497,
    phone: '876-555-0223',
    whatsapp: '876-555-0223',
    website: 'https://clarendonhardware.example',
  }),
  business({
    id: 'biz-mama-joys',
    name: "Mama Joy's Cook Shop",
    slug: 'mama-joys-cook-shop',
    category_id: 'cat-cookshops',
    tier_id: 'tier-standard',
    town: 'May Pen',
    description:
      'Home-style Jamaican cooking. Curry goat on Fridays, oxtail on Saturdays, and the best stew peas in May Pen.',
    address: '3 Bryant Street, May Pen',
    lat: 17.9689,
    lng: -77.2423,
    phone: '876-555-0177',
    whatsapp: '876-555-0177',
    hours: {
      '1': [{ open: '07:00', close: '19:00' }],
      '2': [{ open: '07:00', close: '19:00' }],
      '3': [{ open: '07:00', close: '19:00' }],
      '4': [{ open: '07:00', close: '19:00' }],
      '5': [{ open: '07:00', close: '21:00' }],
      '6': [{ open: '07:00', close: '21:00' }],
      '7': null,
    },
  }),
  business({
    id: 'biz-denbigh-agri',
    name: 'Denbigh Agricultural Supplies',
    slug: 'denbigh-agricultural-supplies',
    category_id: 'cat-agri',
    tier_id: 'tier-standard',
    town: 'Denbigh',
    description:
      'Seed, fertiliser, feed and veterinary supplies for Clarendon farmers. Advice from people who farm themselves.',
    address: 'Denbigh Showground Road, Denbigh',
    lat: 17.9861,
    lng: -77.2694,
    phone: '876-555-0311',
    whatsapp: '876-555-0311',
  }),
  business({
    id: 'biz-chapelton-pharmacy',
    name: 'Chapelton Community Pharmacy',
    slug: 'chapelton-community-pharmacy',
    category_id: 'cat-pharmacies',
    tier_id: 'tier-standard',
    town: 'Chapelton',
    description:
      'Prescription dispensing, over-the-counter medicines and free blood pressure checks every Wednesday.',
    address: '11 Main Street, Chapelton',
    lat: 18.0833,
    lng: -77.2667,
    phone: '876-555-0256',
  }),
  business({
    id: 'biz-frankfield-motors',
    name: 'Frankfield Motors & Repairs',
    slug: 'frankfield-motors-repairs',
    category_id: 'cat-mechanics',
    tier_id: 'tier-basic',
    town: 'Frankfield',
    description:
      'General vehicle servicing, brakes, suspension and diagnostics. Pick-up available within Frankfield.',
    address: 'Coffee Piece Road, Frankfield',
    phone: '876-555-0289',
  }),
  business({
    id: 'biz-milk-river-guesthouse',
    name: 'Milk River Guest House',
    slug: 'milk-river-guest-house',
    category_id: 'cat-accommodation',
    tier_id: 'tier-featured',
    town: 'Milk River',
    description:
      'Eight rooms a short walk from the mineral baths. Breakfast included, tours to Alligator Hole arranged.',
    address: 'Bath Road, Milk River',
    lat: 17.8956,
    lng: -77.3736,
    phone: '876-555-0334',
    whatsapp: '876-555-0334',
    email: 'stay@milkriverguesthouse.example',
    website: 'https://milkriverguesthouse.example',
  }),
  business({
    id: 'biz-lionel-town-bakery',
    name: 'Lionel Town Bakery',
    slug: 'lionel-town-bakery',
    category_id: 'cat-bakeries',
    tier_id: 'tier-standard',
    town: 'Lionel Town',
    description:
      'Hard dough bread, bulla, spice bun and birthday cakes to order. Baking in Lionel Town since 1994.',
    address: '22 High Street, Lionel Town',
    lat: 17.8167,
    lng: -77.2417,
    phone: '876-555-0401',
    whatsapp: '876-555-0401',
  }),
  business({
    id: 'biz-parkside-salon',
    name: 'Parkside Hair Studio',
    slug: 'parkside-hair-studio',
    category_id: 'cat-salons',
    tier_id: 'tier-standard',
    town: 'May Pen',
    description:
      'Braiding, locs, relaxers, colour and treatments. Walk-ins welcome, appointments preferred on Saturdays.',
    address: '9 Park Avenue, May Pen',
    lat: 17.9701,
    lng: -77.2445,
    phone: '876-555-0367',
    whatsapp: '876-555-0367',
  }),
  business({
    id: 'biz-toll-gate-taxi',
    name: 'Toll Gate Route Taxi Association',
    slug: 'toll-gate-route-taxi-association',
    category_id: 'cat-taxi',
    tier_id: 'tier-basic',
    town: 'Toll Gate',
    description:
      'Licensed route taxis serving Toll Gate to May Pen and Toll Gate to Clarendon Park. Charter available.',
    phone: '876-555-0455',
  }),
  business({
    id: 'biz-hayes-welding',
    name: 'Hayes Welding & Fabrication',
    slug: 'hayes-welding-fabrication',
    category_id: 'cat-welders',
    tier_id: 'tier-basic',
    town: 'Hayes',
    description:
      'Grilles, gates, burglar bars and general fabrication. Free measurement and quotation.',
    address: 'Race Course Road, Hayes',
    phone: '876-555-0512',
  }),
  business({
    id: 'biz-rocky-point-seafood',
    name: 'Rocky Point Fresh Seafood',
    slug: 'rocky-point-fresh-seafood',
    category_id: 'cat-restaurants',
    tier_id: 'tier-standard',
    town: 'Rocky Point',
    description:
      'Fish, lobster and conch straight off the boats. Eat in on the beach or take away by the pound.',
    address: 'Fishing Beach, Rocky Point',
    lat: 17.7833,
    lng: -77.2,
    phone: '876-555-0578',
    whatsapp: '876-555-0578',
  }),
  business({
    id: 'biz-kellits-hardware',
    name: 'Kellits General Store',
    slug: 'kellits-general-store',
    category_id: 'cat-grocery',
    tier_id: 'tier-basic',
    town: 'Kellits',
    description:
      'Groceries, provisions, household goods and farming basics for north Clarendon.',
    address: 'Main Road, Kellits',
    phone: '876-555-0601',
  }),
  business({
    id: 'biz-may-pen-barbers',
    name: 'Sharp Line Barbershop',
    slug: 'sharp-line-barbershop',
    category_id: 'cat-barbers',
    tier_id: 'tier-basic',
    town: 'May Pen',
    description: 'Fades, line-ups, beard trims. Open late Thursday to Saturday.',
    address: '31 Church Street, May Pen',
    phone: '876-555-0644',
  }),
  business({
    id: 'biz-four-paths-plumbing',
    name: 'Four Paths Plumbing Co.',
    slug: 'four-paths-plumbing-co',
    category_id: 'cat-plumbers',
    tier_id: 'tier-basic',
    town: 'Four Paths',
    description:
      'Domestic plumbing, water tank installation and leak detection across southern Clarendon.',
    phone: '876-555-0688',
  }),
  business({
    id: 'biz-may-pen-dental',
    name: 'May Pen Family Dental',
    slug: 'may-pen-family-dental',
    category_id: 'cat-dentists',
    tier_id: 'tier-standard',
    town: 'May Pen',
    description:
      'Cleanings, fillings, extractions and children’s dentistry. Payment plans available.',
    address: '18 Bustamante Boulevard, May Pen',
    lat: 17.9645,
    lng: -77.2412,
    phone: '876-555-0722',
    whatsapp: '876-555-0722',
    website: 'https://maypenfamilydental.example',
  }),
  business({
    id: 'biz-spaldings-guesthouse',
    name: 'Highland View Guest House',
    slug: 'highland-view-guest-house',
    category_id: 'cat-accommodation',
    tier_id: 'tier-basic',
    town: 'Spaldings',
    description:
      'Quiet rooms in the cool hills of north Clarendon. Long-stay rates for contractors and students.',
    phone: '876-555-0766',
  }),
]

// ---------------------------------------------------------------------------
// Town editorial copy — demonstrates the "not thin templated text" requirement
// ---------------------------------------------------------------------------

export const seedTownCopy: TownCopy[] = [
  {
    id: 'town-may-pen',
    town: 'May Pen',
    slug: 'may-pen',
    intro: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'May Pen is the capital of Clarendon and its commercial centre, sitting on the Rio Minho where the main road west from Kingston crosses the river. It is the parish’s largest market town, and the place most Clarendon residents come to for hardware, banking, medical care and trade services.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The businesses listed below serve May Pen town and the surrounding districts, including Denbigh, Sevens, Bucknor and Palmers Cross. Most will travel across central Clarendon on request.',
            },
          ],
        },
      ],
    },
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
]

// ---------------------------------------------------------------------------
// News posts — a small set so the homepage and related-listings work in Phase 2
// ---------------------------------------------------------------------------

function paragraphDoc(...paragraphs: string[]) {
  return {
    type: 'doc' as const,
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  }
}

/**
 * Additional seeded news, kept terse with a helper so the list stays readable.
 * ALL FICTIONAL — invented Clarendon stories for development and demonstration.
 */
function newsPost(input: {
  id: string
  section: string
  title: string
  slug: string
  excerpt: string
  paragraphs: string[]
  category: NewsPost['category']
  town: string | null
  date: string
}): NewsPost {
  return {
    id: input.id,
    section_id: input.section,
    author_id: null,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    body: paragraphDoc(...input.paragraphs),
    category: input.category,
    hero_image_url: null,
    hero_image_alt: null,
    town: input.town,
    publish_date: input.date,
    status: 'published',
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  }
}

const moreNews: NewsPost[] = [
  newsPost({
    id: 'news-council-market',
    section: 'sec-business',
    title: 'Council approves May Pen market refurbishment',
    slug: 'council-approves-may-pen-market-refurbishment',
    excerpt:
      'The Clarendon Municipal Corporation voted to fund new roofing, drainage and sanitary facilities at the May Pen market, with work to begin in the new quarter.',
    paragraphs: [
      'The Clarendon Municipal Corporation has approved funding for a refurbishment of the May Pen market, covering new roofing over the produce section, improved drainage and rebuilt sanitary facilities.',
      'Vendors have raised concerns about flooding in the lower section for several years. Water collecting along the eastern wall has repeatedly spoiled produce and made the ground unsafe underfoot during the wet months. The corporation said the drainage work is intended to address that directly, with new channels running out to the existing storm system rather than the shallow soakaways currently in place.',
      'The roofing work covers the produce section and the meat and fish stalls, both of which have been patched piecemeal for the better part of a decade. Vendors trading under the worst of the leaks have been offered temporary places along the northern aisle while their sections are closed.',
      'Trading will continue throughout, with sections closed in rotation rather than a full shutdown. The corporation was explicit on that point: a full closure would push vendors onto the roadside for months, which it described as unacceptable for both traders and traffic.',
      'A vendors committee will meet the works contractor before the first section closes, to agree the rotation order and the notice period each group receives. The corporation has asked that no section be closed with less than two weeks notice.',
      'Funding comes from the current capital allocation, with the corporation noting that no increase in market fees is proposed to cover it. Councillors for the surrounding divisions supported the vote, though two asked for a written timetable before work begins.',
    ],
    category: 'council_decisions',
    town: 'May Pen',
    date: '2026-01-14T08:30:00.000Z',
  }),
  newsPost({
    id: 'news-glenmuir-cape',
    section: 'sec-education',
    title: 'Glenmuir students take top CAPE results in the parish',
    slug: 'glenmuir-students-take-top-cape-results',
    excerpt:
      'Four students recorded straight distinctions, with the school reporting its strongest unit passes in physics and communication studies in several years.',
    paragraphs: [
      'Glenmuir High School has recorded the strongest CAPE performance in Clarendon this year, with four students achieving straight distinctions across their units.',
      'Physics and communication studies both showed marked improvement on the previous year, which the school attributed to restructured afternoon sessions.',
      'The principal credited sustained attendance and a tutoring programme run with past students.',
    ],
    category: 'school_results',
    town: 'May Pen',
    date: '2026-01-13T14:00:00.000Z',
  }),
  newsPost({
    id: 'news-chapelton-church',
    section: 'sec-culture',
    title: 'Chapelton church marks 150 years with week of services',
    slug: 'chapelton-church-marks-150-years',
    excerpt:
      'A week of services, a heritage exhibition and a community dinner will mark the anniversary, with former members travelling back to the parish.',
    paragraphs: [
      'The parish church at Chapelton marks its 150th anniversary this month with a week of services, a heritage exhibition and a community dinner on the closing Sunday.',
      'The exhibition will display registers, photographs and correspondence held by the church since the 1870s.',
      'Organisers expect former members to travel back from Kingston and overseas for the closing weekend.',
    ],
    category: 'community_events',
    town: 'Chapelton',
    date: '2026-01-11T10:00:00.000Z',
  }),
  newsPost({
    id: 'news-cricket-final',
    section: 'sec-sports',
    title: 'Frankfield take parish cricket final by four wickets',
    slug: 'frankfield-take-parish-cricket-final',
    excerpt:
      'A late partnership settled a tight final at Denbigh, with Frankfield chasing down 184 with three overs to spare.',
    paragraphs: [
      'Frankfield won the Clarendon parish cricket final by four wickets at Denbigh on Saturday, chasing 184 with three overs remaining.',
      'The match turned on a seventh-wicket partnership of 61 after Frankfield had slipped to 96 for 6.',
      'It is the club\'s first parish title since 2019.',
    ],
    category: 'sports_results',
    town: 'Frankfield',
    date: '2026-01-10T18:00:00.000Z',
  }),
  newsPost({
    id: 'news-milk-river-road',
    section: 'sec-business',
    title: 'Milk River road closed for bridge inspection',
    slug: 'milk-river-road-closed-for-bridge-inspection',
    excerpt:
      'The approach to the mineral baths will be closed for two days while engineers carry out a structural inspection of the bridge.',
    paragraphs: [
      'The road leading to the Milk River mineral baths will close for two days from Wednesday while engineers carry out a structural inspection of the bridge.',
      'A diversion will be signposted via Race Course. Buses serving the bath will terminate at the junction during the closure.',
      'The National Works Agency said the inspection is routine and no defects have been reported.',
    ],
    category: 'road_works',
    town: 'Milk River',
    date: '2026-01-09T07:00:00.000Z',
  }),
  newsPost({
    id: 'news-lionel-town-bakery',
    section: 'sec-business',
    title: 'Lionel Town bakery opens second counter',
    slug: 'lionel-town-bakery-opens-second-counter',
    excerpt:
      'The High Street bakery has opened a second service counter and extended trading hours to Saturday evenings.',
    paragraphs: [
      'The bakery on High Street in Lionel Town has opened a second service counter, adding four jobs and extending Saturday trading into the evening.',
      'The expansion follows steady growth in cake and party orders, which the owners said now account for a third of turnover.',
      'The premises have been baking in Lionel Town since 1994.',
    ],
    category: 'business_openings',
    town: 'Lionel Town',
    date: '2026-01-08T09:00:00.000Z',
  }),
  newsPost({
    id: 'news-obituary-teacher',
    section: 'sec-culture',
    title: 'Retired headteacher Iris Campbell remembered in Hayes',
    slug: 'retired-headteacher-iris-campbell-remembered',
    excerpt:
      'Mrs Campbell taught in Hayes for thirty-one years and led the primary school through its 1980s expansion. She was 84.',
    paragraphs: [
      'Iris Campbell, who taught in Hayes for thirty-one years and served as headteacher of the primary school through its expansion in the 1980s, has died aged 84.',
      'Former pupils gathered at the school on Sunday to mark her passing.',
      'A thanksgiving service will be held at the parish church next Saturday.',
    ],
    category: 'obituaries',
    town: 'Hayes',
    date: '2026-01-07T12:00:00.000Z',
  }),
  newsPost({
    id: 'news-council-water',
    section: 'sec-business',
    title: 'Council presses for water supply upgrade in north Clarendon',
    slug: 'council-presses-water-supply-upgrade-north-clarendon',
    excerpt:
      'Councillors voted to formally request accelerated works from the National Water Commission after repeated outages in Kellits and Crofts Hill.',
    paragraphs: [
      'Clarendon councillors have voted to formally request accelerated supply works from the National Water Commission following repeated outages across the north of the parish.',
      'Residents in Kellits and Crofts Hill have reported interruptions lasting several days at a time through the dry season.',
      'The corporation will seek a timetable for the upgrade at its next sitting.',
    ],
    category: 'council_decisions',
    town: 'Kellits',
    date: '2026-01-06T11:00:00.000Z',
  }),
  newsPost({
    id: 'news-athletics-trials',
    section: 'sec-sports',
    title: 'Parish athletics trials draw record entry at Denbigh',
    slug: 'parish-athletics-trials-record-entry-denbigh',
    excerpt:
      'More than four hundred athletes from eighteen schools entered this year\'s trials, the largest field the meet has recorded.',
    paragraphs: [
      'More than four hundred athletes from eighteen Clarendon schools entered this year\'s parish athletics trials at Denbigh, the largest field the meet has recorded.',
      'Organisers added a second day to accommodate the entry.',
      'Selected athletes go forward to the regional championships next month.',
    ],
    category: 'sports_results',
    town: 'Denbigh',
    date: '2026-01-05T16:00:00.000Z',
  }),
  newsPost({
    id: 'news-four-paths-shop',
    section: 'sec-business',
    title: 'Hardware and farm supply opens at Four Paths',
    slug: 'hardware-and-farm-supply-opens-four-paths',
    excerpt:
      'The new premises stock building materials alongside feed and veterinary supplies, filling a gap for farmers in the south of the parish.',
    paragraphs: [
      'A combined hardware and farm supply has opened at Four Paths, stocking building materials alongside animal feed and veterinary supplies.',
      'The owners said the mix was chosen because farmers in the south of the parish have been travelling to May Pen for both.',
      'The premises employ six people.',
    ],
    category: 'business_openings',
    town: 'Four Paths',
    date: '2026-01-04T09:30:00.000Z',
  }),
  newsPost({
    id: 'news-rocky-point-fishing',
    section: 'sec-culture',
    title: 'Rocky Point fishing beach festival returns in February',
    slug: 'rocky-point-fishing-beach-festival-returns',
    excerpt:
      'The festival returns after a three-year gap, with boat races, a seafood market and music through the afternoon.',
    paragraphs: [
      'The Rocky Point fishing beach festival returns in February after a three-year gap, with boat races, a seafood market and music through the afternoon.',
      'Organisers said the break was due to funding rather than a lack of interest, and that vendor places filled within a fortnight of being announced.',
      'Proceeds support the fishermen\'s co-operative.',
    ],
    category: 'community_events',
    town: 'Rocky Point',
    date: '2026-01-03T13:00:00.000Z',
  }),
  newsPost({
    id: 'news-toll-gate-primary',
    section: 'sec-education',
    title: 'Toll Gate primary reports full pass rate in national tests',
    slug: 'toll-gate-primary-full-pass-rate-national-tests',
    excerpt:
      'Every candidate at the school passed this year\'s national assessments, a first for the school in its current form.',
    paragraphs: [
      'Every candidate entered by Toll Gate primary passed this year\'s national assessments, a first for the school.',
      'Staff pointed to small-group reading sessions introduced two years ago as the main change.',
      'The school will expand the sessions to the year below from next term.',
    ],
    category: 'school_results',
    town: 'Toll Gate',
    date: '2026-01-02T10:30:00.000Z',
  }),
]

export const seedNewsPosts: NewsPost[] = [
  {
    id: 'news-denbigh-road',
    section_id: 'sec-business',
    author_id: null,
    title: 'Denbigh main road resurfacing begins Monday',
    slug: 'denbigh-main-road-resurfacing-begins-monday',
    excerpt:
      'Work on the Denbigh stretch starts Monday and is expected to take three weeks, with single-lane traffic in effect during working hours.',
    body: paragraphDoc(
      'Resurfacing work on the Denbigh main road begins Monday morning, with the National Works Agency confirming a three-week schedule subject to weather.',
      'Traffic will be reduced to a single lane between 7:00am and 4:00pm on weekdays. Drivers heading to May Pen from the north are advised to allow extra time or use the Sevens Road alternative.',
      'Businesses along the affected stretch will remain open throughout. Access to the Denbigh Showground will be maintained.',
    ),
    category: 'road_works',
    hero_image_url: null,
    hero_image_alt: null,
    town: 'Denbigh',
    publish_date: '2026-01-12T09:00:00.000Z',
    status: 'published',
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'news-hardware-opening',
    section_id: 'sec-business',
    author_id: null,
    title: 'New hardware depot opens on Manchester Avenue',
    slug: 'new-hardware-depot-opens-manchester-avenue',
    excerpt:
      'The expanded Clarendon Hardware Depot opened Saturday, adding a lumber yard and contractor trade counter.',
    body: paragraphDoc(
      'Clarendon Hardware Depot opened its expanded Manchester Avenue premises on Saturday, roughly doubling its floor space and adding a dedicated lumber yard.',
      'The expansion adds a trade counter for contractors and, according to management, delivery across the parish for bulk orders.',
      'The opening brings eleven new jobs to May Pen.',
    ),
    category: 'business_openings',
    hero_image_url: null,
    hero_image_alt: null,
    town: 'May Pen',
    publish_date: '2026-01-10T14:00:00.000Z',
    status: 'published',
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'news-schools-cxc',
    section_id: 'sec-education',
    author_id: null,
    title: 'Clarendon schools post strongest CSEC results in five years',
    slug: 'clarendon-schools-post-strongest-csec-results-five-years',
    excerpt:
      'Parish-wide passes in mathematics and English rose again this year, with three May Pen schools above the national average.',
    body: paragraphDoc(
      'Clarendon secondary schools recorded their strongest CSEC performance in five years, with parish-wide passes in mathematics and English both improving on last year.',
      'Three May Pen schools finished above the national average in both subjects.',
      'Principals credited sustained after-school tutoring programmes and better attendance following the return to full timetables.',
    ),
    category: 'school_results',
    hero_image_url: null,
    hero_image_alt: null,
    town: 'May Pen',
    publish_date: '2026-01-08T11:00:00.000Z',
    status: 'published',
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  },
  ...moreNews,
]

// ---------------------------------------------------------------------------
// Topics — what a story is ABOUT, as opposed to its category (what KIND of
// story it is) or its town (where it happened). ALL FICTIONAL, like everything
// else in this file: these are invented subjects for invented stories.
//
// `featured` drives the "In the parish now" bar. It is an editor's choice, not
// a measurement — nothing counts news views, so nothing here claims to.
// ---------------------------------------------------------------------------

function topic(input: {
  id: string
  name: string
  slug: string
  kind: Topic['kind']
  description: string
  featured?: boolean
  sortOrder?: number
  intro?: string[]
}): Topic {
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    kind: input.kind,
    description: input.description,
    intro: input.intro ? paragraphDoc(...input.intro) : null,
    featured: input.featured ?? false,
    sort_order: input.sortOrder ?? 0,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
    created_at: now,
    updated_at: now,
  }
}

export const seedTopics: Topic[] = [
  topic({
    id: 'topic-denbigh-show',
    name: 'Denbigh Agricultural Show',
    slug: 'denbigh-agricultural-show',
    kind: 'event',
    description:
      'The annual agricultural and industrial show held at the Denbigh Showground.',
    featured: true,
    sortOrder: 1,
    intro: [
      'The Denbigh Agricultural, Industrial and Food Show is held each year at the Denbigh Showground outside May Pen, drawing farmers and exhibitors from every parish.',
      'Heartland JA follows the show, the ground and the road and transport arrangements that surround it.',
    ],
  }),
  topic({
    id: 'topic-parish-council',
    name: 'Parish Council',
    slug: 'parish-council',
    kind: 'subject',
    description:
      'Decisions of the Clarendon Municipal Corporation and what they mean for residents.',
    featured: true,
    sortOrder: 2,
    intro: [
      'Council decisions shape the market, the roads, the water supply and the permits every business in the parish depends on.',
      'This page collects our reporting on what the council has decided and what follows from it.',
    ],
  }),
  topic({
    id: 'topic-roads-transport',
    name: 'Roads and Transport',
    slug: 'roads-and-transport',
    kind: 'subject',
    description:
      'Road works, closures, bridge repairs and transport across Clarendon.',
    featured: true,
    sortOrder: 3,
  }),
  topic({
    id: 'topic-schools',
    name: 'Clarendon Schools',
    slug: 'clarendon-schools',
    kind: 'subject',
    description:
      'Examination results, school news and education across the parish.',
    featured: true,
    sortOrder: 4,
  }),
  topic({
    id: 'topic-cricket',
    name: 'Clarendon Cricket',
    slug: 'clarendon-cricket',
    kind: 'subject',
    description: 'Parish cricket — fixtures, results and the clubs behind them.',
    sortOrder: 5,
  }),
  topic({
    id: 'topic-athletics',
    name: 'Athletics',
    slug: 'athletics',
    kind: 'subject',
    description: 'Track and field across Clarendon, from trials to championships.',
    sortOrder: 6,
  }),
  topic({
    id: 'topic-churches',
    name: 'Churches',
    slug: 'churches',
    kind: 'subject',
    description: 'Congregations, anniversaries and church life in the parish.',
    sortOrder: 7,
  }),
  topic({
    id: 'topic-farming',
    name: 'Farming',
    slug: 'farming',
    kind: 'subject',
    description: 'Agriculture, growers and the produce trade in Clarendon.',
    featured: true,
    sortOrder: 8,
  }),
  topic({
    id: 'topic-fishing',
    name: 'Fishing',
    slug: 'fishing',
    kind: 'subject',
    description:
      'The fishing beaches of south Clarendon and the communities around them.',
    sortOrder: 9,
  }),
  topic({
    id: 'topic-water-supply',
    name: 'Water Supply',
    slug: 'water-supply',
    kind: 'subject',
    description: 'Supply, storage and reliability of water across the parish.',
    sortOrder: 10,
  }),
  topic({
    id: 'topic-new-business',
    name: 'New Businesses',
    slug: 'new-businesses',
    kind: 'subject',
    description: 'Openings, expansions and new trade in Clarendon.',
    sortOrder: 11,
  }),
  topic({
    id: 'topic-may-pen-market',
    name: 'May Pen Market',
    slug: 'may-pen-market',
    kind: 'place',
    description: 'The parish market at May Pen — traders, works and trading days.',
    sortOrder: 12,
  }),
]

/**
 * Which topics each seeded story carries.
 *
 * Kept as a map from post id rather than a field on the post so the shape of
 * `NewsPost` stays exactly what the database returns — the join lives in
 * `news_post_topics`, and the seed mirrors that rather than inventing a
 * denormalised field the real reader would not have.
 */
export const seedNewsPostTopics: Record<string, string[]> = {
  'news-denbigh-road': ['topic-roads-transport', 'topic-denbigh-show'],
  'news-hardware-opening': ['topic-new-business'],
  'news-schools-cxc': ['topic-schools'],
  'news-council-market': [
    'topic-parish-council',
    'topic-may-pen-market',
    'topic-new-business',
  ],
  'news-glenmuir-cape': ['topic-schools'],
  'news-chapelton-church': ['topic-churches'],
  'news-cricket-final': ['topic-cricket'],
  'news-milk-river-road': ['topic-roads-transport'],
  'news-lionel-town-bakery': ['topic-new-business'],
  'news-obituary-teacher': ['topic-schools'],
  'news-council-water': ['topic-parish-council', 'topic-water-supply'],
  'news-athletics-trials': ['topic-athletics', 'topic-denbigh-show'],
  'news-four-paths-shop': ['topic-new-business', 'topic-farming'],
  'news-rocky-point-fishing': ['topic-fishing'],
  'news-toll-gate-primary': ['topic-schools'],
}

