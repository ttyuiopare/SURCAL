/**
 * Seed script: populates the marketplace with 1000+ realistic open requests
 * so the /requests page (and category pages) look alive.
 *
 * Usage:
 *   node scripts/seed-requests.mjs            # seed ~1,100 requests
 *   node scripts/seed-requests.mjs --cleanup  # delete everything this script
 *                                             # ever created (requests cascade
 *                                             # when their seed buyers are deleted)
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * All rows are tagged with seed-buyer emails @surcal-seed.test so cleanup is
 * precise and real users are never touched.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const CLEANUP = process.argv.includes('--cleanup');
const TARGET_REQUESTS = 1100;
const BUYER_COUNT = 24;
const SEED_DOMAIN = 'surcal-seed.test';

// --- load .env.local ---------------------------------------------------------
function loadEnv() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- content pools -----------------------------------------------------------
const BUYER_NAMES = [
  'Jordan Reyes', 'Maya Chen', 'Dev Patel', 'Sam Okafor', 'Emily Ross',
  'Marcus Lee', 'Priya Nair', 'Tyler Brooks', 'Ava Thompson', 'Chris Delgado',
  'Nina Park', 'Leo Fischer', 'Grace Miller', 'Andre Silva', 'Hannah Cole',
  'Ravi Shah', 'Bella Ortiz', 'Kevin Zhao', 'Sofia Marino', 'Damon Wells',
  'Chloe Bennett', 'Omar Haddad', 'Lucy Tran', 'Ethan Ward',
];

const ITEMS = {
  'Sneakers & Streetwear': {
    budgets: [90, 480],
    items: [
      'Jordan 1 Retro High OG Chicago',
      'Nike Dunk Low Panda',
      'Adidas Samba OG Cloud White',
      'Yeezy Boost 350 V2 Zebra',
      'New Balance 550 White Grey',
      'Nike Air Force 1 ’07 Triple White',
      'Travis Scott x Jordan 1 Low Mocha',
      'Jordan 4 Retro Military Black',
      'New Balance 990v6 Grey Navy',
      'Nike SB Dunk Low Chunky Dunky',
      'Carhartt WIP Detroit Jacket',
      'The North Face 1996 Retro Nuptse',
      'Stussy 8-Ball Fleece Hoodie',
      'Supreme Box Logo Hoodie',
      'Patagonia Better Sweater',
    ],
    size: (t) => (/jordan|dunk|yeezy|samba|550|force|990/i.test(t) ? ` — size ${7 + Math.floor(Math.random() * 7)}` : ''),
  },
  'Electronics & Computers': {
    budgets: [80, 2400],
    items: [
      'Sony WH-1000XM5 Headphones',
      'iPhone 14 Pro 256GB Unlocked',
      'iPhone 13 128GB Unlocked',
      'PlayStation 5 Slim Disc Edition',
      'Nintendo Switch OLED',
      'MacBook Air M2 13" 256GB',
      'iPad Air 5th gen 64GB WiFi',
      'LG C3 55" OLED TV',
      'Sony A7III Body Only',
      'Canon EOS R6 Mark II',
      'DJI Mini 3 Pro Fly More Combo',
      'Kindle Paperwhite 11th gen',
      'Apple Watch Series 9 45mm',
      'Steam Deck OLED 512GB',
      'Keychron Q1 Pro Mechanical Keyboard',
    ],
  },
  'Collectibles & Trading Cards': {
    budgets: [40, 950],
    items: [
      'Charizard UPC Promo Card',
      '2023-24 Prizm NBA Hobby Box',
      'Pokemon Obsidian Flames ETB',
      'One Piece OP-05 Booster Box',
      'Patrick Mahomes Prizm Rookie PSA 9',
      'Star Wars Black Series Vader (Vintage)',
      'Funko Pop Batman 1989 Glow',
      'LEGO Titanic 10294 (Sealed)',
      'Serialised Gengar VMAX Rainbow',
      'Topps Chrome MLS Hobby Box',
    ],
  },
  'Jewelry & Watches': {
    budgets: [90, 3200],
    items: [
      'Seiko SKX007 Mod-Ready',
      'Orient Bambino v2 Champagne',
      'Casio G-Shock DW-5600E',
      'Tissot PRX Powermatic 80',
      'Seiko 5 Sports SRPD55',
      'David Yurman Cable Bracelet',
      'Timex Expedition Scout 40mm',
      'Citizen Promaster Diver',
    ],
  },
  'Automotive Parts': {
    budgets: [35, 750],
    items: [
      'Mishimoto Aluminium Radiator (GT86/BRZ)',
      'Mishimoto Silicone Radiator Hose Kit',
      'KW V1 Coilovers (MK7 GTI)',
      'APR Stage 1 ECU Flash (MQB)',
      'Borla S-Type Catback (WRX 2015+)',
      'Michelin Pilot Sport 4S — set of 4, 245/40R18',
      'Falken Azenis RT660 — 235/40R18 pair',
      'Rally Armor UR Mud Flaps (WRX)',
    ],
  },
  'Home & Garden': {
    budgets: [40, 800],
    items: [
      'Herman Miller Aeron Remastered Size B',
      'Autonomous ErgoChair 2',
      'Weber Original Kettle 22"',
      'Yeti Tundra 45 Cooler',
      'Dyson V15 Detect Absolute',
      'Levoit Core 600S Air Purifier',
      'Barista Express Espresso Machine BES870',
      'Solo Stove Bonfire 2.0',
    ],
  },
  'Perfume & Bath': {
    budgets: [40, 260],
    items: [
      'Dior Sauvage EDP 100ml',
      'Bleu de Chanel EDP 100ml',
      'Le Labo Santal 33 50ml',
      'Creed Aventus 100ml',
      'YSL Libre EDP 90ml',
      'Ariana Grande Cloud 100ml',
      'Byredo Gypsy Water 50ml',
    ],
  },
};

const CONDITIONS = [
  'brand new, sealed in box',
  'new, box opened but unused',
  'like new — no scratches, box included',
  'gently used, light signs of wear',
  'good condition, fully functional',
  'used but well cared for',
];

const QUIRKS = [
  'No reps or fakes — I will verify authenticity before escrow releases.',
  'Must come from a smoke-free home.',
  'Please include the original receipt or proof of purchase if you have it.',
  'All original accessories required (cables, box, manuals).',
  'No major dents, cracks, or deep scratches — please send real photos of the actual item.',
  'Serial number must be intact and verifiable.',
  'I can pay instantly through escrow as soon as we agree on a price.',
  'Not looking to pay resale hype prices — fair offers only.',
  'Shipping must include tracking. Signature on delivery is a plus for this price range.',
  'Happy to cover part of shipping for the right offer.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildTitle(category) {
  const pool = ITEMS[category];
  const item = pick(pool.items);
  return item + (pool.size ? pool.size(item) : '');
}

function buildDescription(title, category) {
  const condition = pick(CONDITIONS);
  const quirkA = pick(QUIRKS);
  let quirkB = pick(QUIRKS);
  if (quirkB === quirkA) quirkB = '';
  return (
    `Looking for a ${title}. Ideally ${condition}. ` +
    `${quirkA}${quirkB ? ' ' + quirkB : ''} ` +
    `Budget reflects what this usually goes for in ${condition.split('—')[0].trim()} shape — ` +
    `send your best offer with real photos and I'll decide fast.`
  );
}

// --- seed buyers -------------------------------------------------------------
async function ensureBuyers() {
  const buyers = [];
  for (let i = 0; i < BUYER_COUNT; i++) {
    const email = `seed-buyer-${String(i + 1).padStart(2, '0')}@${SEED_DOMAIN}`;
    const name = BUYER_NAMES[i % BUYER_NAMES.length];
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: randomBytes(18).toString('base64url'),
      email_confirm: true,
      user_metadata: { name, role: 'buyer', state: 'CA' },
    });
    if (error) {
      // Already exists from a previous run — recover the id from profiles.
      if (!/already|exists/i.test(error.message)) throw error;
      const { data: row } = await admin
        .from('profiles')
        .select('id, name')
        .eq('email', email)
        .single();
      if (!row) throw new Error(`Could not recover seed user ${email}: ${error.message}`);
      buyers.push(row);
    } else {
      buyers.push({ id: data.user.id, name });
    }
  }
  return buyers;
}

// --- seed requests -----------------------------------------------------------
async function main() {
  const categoryRows = (await admin.from('categories').select('id, name')).data ?? [];
  if (categoryRows.length === 0) {
    console.error('No categories found in the database — run migration 03 first.');
    process.exit(1);
  }
  // Weight popular categories so the feed feels natural.
  const weighted = [];
  for (const c of categoryRows) {
    const weight = /Sneakers|Electronics|Collectibles/.test(c.name) ? 4 : 2;
    for (let i = 0; i < weight; i++) weighted.push(c);
  }

  if (CLEANUP) {
    const { data: seedProfiles } = await admin
      .from('profiles')
      .select('id')
      .like('email', `%@${SEED_DOMAIN}`);
    const ids = (seedProfiles ?? []).map((p) => p.id);
    if (ids.length > 0) {
      const { error } = await admin.from('profiles').delete().in('id', ids);
      if (error) throw error;
      console.log(`Cleanup: deleted ${ids.length} seed buyers (their requests cascaded).`);
    } else {
      console.log('Cleanup: nothing to delete.');
    }
    return;
  }

  console.log(`Ensuring ${BUYER_COUNT} seed buyers…`);
  const buyers = await ensureBuyers();
  console.log(`Buyers ready: ${buyers.length}`);

  console.log(`Generating ${TARGET_REQUESTS} open requests…`);
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < TARGET_REQUESTS; i++) {
    const category = pick(weighted);
    const title = buildTitle(category.name);
    const buyer = pick(buyers);
    // Skew recent: ~40% within the last 7 days, the rest spread over 90 days.
    const ageDays = Math.random() < 0.4 ? Math.random() * 7 : Math.random() * 90;
    const createdAt = new Date(now - ageDays * 86400000);
    const deadline = new Date(createdAt.getTime() + randInt(2, 30) * 86400000);
    const [lo, hi] = ITEMS[category.name].budgets;
    const budget = Math.round((lo + Math.random() * (hi - lo)) / 5) * 5 - 0.01;

    rows.push({
      buyer_id: buyer.id,
      title,
      description: buildDescription(title, category.name),
      category_id: category.id,
      budget,
      deadline: deadline.toISOString(),
      status: 'open',
      created_at: createdAt.toISOString(),
    });
  }

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await admin.from('requests').insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
    inserted += Math.min(CHUNK, rows.length - i);
    console.log(`  inserted ${inserted}/${rows.length}`);
  }

  console.log(`\nDone. ${inserted} open requests across ${buyers.length} seed buyers.`);
  console.log(`To remove everything later: node scripts/seed-requests.mjs --cleanup`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
