// Category data powering the /buy landing pages and the sitemap.
//
// Each entry maps to one of the marketplace categories seeded in
// supabase/migrations/03_product_categories.sql. `name` MUST match the DB
// category name so links into /requests can filter correctly.

export type BuyCategory = {
  slug: string;
  /** Must match the categories.name value in the database. */
  name: string;
  /** Short label for nav/cards. */
  shortLabel: string;
  /** <title> — front-loads the buyer-intent keyword. */
  title: string;
  /** <meta description>. */
  description: string;
  /** On-page H1. */
  h1: string;
  /** Lead paragraph under the H1. */
  intro: string;
  /** The real searches this page targets (also rendered as an on-page list). */
  targetSearches: string[];
  /** Example items a buyer might request in this category. */
  examples: string[];
  /** Category-specific FAQ (emitted as FAQPage JSON-LD). */
  faqs: { question: string; answer: string }[];
};

export const CATEGORIES: BuyCategory[] = [
  {
    slug: 'sneakers',
    name: 'Sneakers & Streetwear',
    shortLabel: 'Sneakers & Streetwear',
    title: 'Buy Sneakers Below Resale — Sellers Compete for Your Order',
    description:
      'Post the exact pair you want — size, colorway, condition — and let verified sellers compete. Beat StockX and reseller markups. Escrow-protected, free to post.',
    h1: 'Get the sneakers you want — below resale',
    intro:
      'Stop refreshing sold-out drops and paying scalper prices. On Surcal you post the exact pair — model, size, colorway and condition — and verified sellers come to you with competing offers. You see the true market price within hours and pay through escrow, so your money is safe until the shoes arrive.',
    targetSearches: [
      'buy sneakers below resale',
      'where to find sold-out sneakers in my size',
      'cheaper than StockX / GOAT',
      'find deadstock Jordans',
      'get offers on sneakers',
    ],
    examples: [
      'Air Jordan 1 High "Chicago" — size 10, deadstock',
      'Nike Dunk Low Panda — size 9, VNDS',
      'Yeezy Boost 350 V2 — size 11, with box',
      'New Balance 550 — size 8.5, any colorway',
    ],
    faqs: [
      {
        question: 'How do I make sure sneakers are authentic on Surcal?',
        answer:
          'Every seller completes Stripe identity verification before they can bid, and your payment stays in escrow until you confirm the pair arrived as described. Add clear reference photos and legit-check requirements to your request so sellers know exactly what you expect.',
      },
      {
        question: 'Can I really pay less than StockX or GOAT?',
        answer:
          'Often, yes. Because multiple sellers compete on your specific request, you cut out the platform markup and the resale premium. You choose the best offer — there is no per-item buyer fee.',
      },
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics & Computers',
    shortLabel: 'Electronics & Computers',
    title: 'Buy Electronics at the Best Price — Skip the eBay Markup',
    description:
      'Post the phone, laptop, camera or console you want and let verified sellers send competing offers. Transparent pricing, Stripe escrow, live tracking. Free to post.',
    h1: 'Post the tech you want. Skip the markup.',
    intro:
      'Whether it is the latest iPhone, a specific MacBook config, a mirrorless camera body or a hard-to-find GPU, describe exactly what you need and let sellers compete. Surcal shows you side-by-side offers so you see the real market price — no listing fees eating into the deal, no guessing whether you overpaid.',
    targetSearches: [
      'buy iPhone best price',
      'find a specific MacBook configuration',
      'buy used camera body online safely',
      'where to buy a GPU below scalper price',
      'get offers on electronics',
    ],
    examples: [
      'iPhone 16 Pro 256GB — unlocked, sealed',
      'MacBook Pro 14" M4 — 24GB RAM, excellent condition',
      'Sony A7 IV body — shutter count under 10k',
      'PlayStation 5 Pro — new, with receipt',
    ],
    faqs: [
      {
        question: 'Is it safe to buy expensive electronics from a stranger?',
        answer:
          'Yes — that is exactly what escrow solves. Your payment is held by Stripe and only released when you confirm the item arrived and matches the description. Every order includes live USPS/UPS/FedEx tracking.',
      },
      {
        question: 'Can I specify condition and included accessories?',
        answer:
          'Absolutely. Set the exact condition, box/accessory requirements, and any specs (RAM, storage, shutter count). The Smart Assistant helps expand your request so sellers quote precisely what you asked for.',
      },
    ],
  },
  {
    slug: 'collectibles',
    name: 'Collectibles & Trading Cards',
    shortLabel: 'Collectibles & Cards',
    title: 'Find Rare Collectibles & Trading Cards — Sellers Bring Them to You',
    description:
      'Name the card, figure or collectible you are hunting and let verified sellers compete. Set grade and condition requirements. Escrow-protected, free to post.',
    h1: "Name what you're hunting. Sellers bring it to you.",
    intro:
      'The best pieces rarely sit in a listing — they move privately. Post the card, figure, or collectible you want, set your grade and condition bar, and let sellers surface it for you. Compare offers side by side and pay through escrow so a grail purchase never means wiring money to a stranger and hoping.',
    targetSearches: [
      'find rare trading cards for sale',
      'buy graded Pokemon cards',
      'where to find a specific PSA card',
      'sports card want list',
      'get offers on collectibles',
    ],
    examples: [
      'PSA 10 Charizard — Base Set, unlimited',
      'Michael Jordan rookie — PSA 8 or better',
      'One Piece OP-01 Alt Art — near mint',
      'Funko Pop Grail — vaulted, boxed',
    ],
    faqs: [
      {
        question: 'Can I require a specific grade or grading company?',
        answer:
          'Yes. Specify PSA/BGS/CGC, the grade floor, and any authentication you need. Ask for photos of the label and slab in your request, and only release escrow once it checks out.',
      },
      {
        question: 'How does Surcal protect high-value collectible purchases?',
        answer:
          'Funds are held in Stripe escrow until you confirm the item, sellers are identity-verified, and your address is never shared with losing bidders. If an item is not as described, you can dispute before releasing payment.',
      },
    ],
  },
  {
    slug: 'automotive-parts',
    name: 'Automotive Parts',
    shortLabel: 'Automotive Parts',
    title: 'Find Auto Parts by Year, Make & Model — Sellers Source Them for You',
    description:
      'Post the exact part with your VIN or fitment details and let verified sellers compete. OEM or aftermarket, new or used. Escrow-protected, free to post.',
    h1: 'Post the part. Let sellers source the fit.',
    intro:
      'Chasing a discontinued OEM part or a specific trim-level component is a slog. Post your year/make/model and fitment details and let sellers who actually have the part come to you. Compare OEM and aftermarket offers, confirm compatibility, and pay through escrow with tracking on every order.',
    targetSearches: [
      'find OEM part by VIN',
      'where to buy a discontinued car part',
      'used auto parts want ad',
      'aftermarket vs OEM part offers',
      'get offers on car parts',
    ],
    examples: [
      'OEM headlight assembly — 2018 BMW 340i, driver side',
      'Turbo for WRX — new or low-mileage used',
      'Factory wheels — Tacoma TRD, set of 4',
      'Transmission mount — Honda Civic Si, OEM only',
    ],
    faqs: [
      {
        question: 'How do I make sure a part actually fits?',
        answer:
          'Include your VIN, year/make/model/trim, and part numbers in the request. Sellers confirm fitment in their offer, and because payment sits in escrow you can verify compatibility before releasing funds.',
      },
      {
        question: 'Can I ask for OEM only?',
        answer:
          'Yes — state OEM-only (or your preferred brand) in the request and the Smart Assistant will flag offers that do not match so you are not sifting through aftermarket bids you did not want.',
      },
    ],
  },
  {
    slug: 'home-and-garden',
    name: 'Home & Garden',
    shortLabel: 'Home & Garden',
    title: 'Buy Home & Garden Items — Post What You Want, Sellers Compete',
    description:
      'Post the furniture, appliance or outdoor item you want and let verified sellers send competing offers. Transparent pricing, Stripe escrow. Free to post.',
    h1: 'Furnish it for less — let sellers compete',
    intro:
      'From a specific mid-century sideboard to a discontinued appliance or patio set, describe what you want and let sellers bring you offers instead of scrolling endless listings. See competing prices side by side and pay through escrow so your money is protected until it arrives.',
    targetSearches: [
      'find discontinued furniture',
      'buy a specific appliance model',
      'where to find out-of-stock home goods',
      'get offers on furniture',
      'used patio set want ad',
    ],
    examples: [
      'West Elm Andes sofa — charcoal, good condition',
      'Discontinued KitchenAid attachment — new',
      'Solid oak dining table — seats 6, any style',
      'Weber Genesis grill — lightly used',
    ],
    faqs: [
      {
        question: 'Can sellers handle large or freight items?',
        answer:
          'Yes. Note dimensions and your delivery expectations in the request; sellers factor shipping or freight into their offer, and tracking is attached once it ships.',
      },
      {
        question: 'What if the item arrives damaged?',
        answer:
          'Do not confirm delivery. Escrow holds the payment until you are satisfied, so you can open a dispute and get refunded if an item shows up damaged or not as described.',
      },
    ],
  },
  {
    slug: 'jewelry-and-watches',
    name: 'Jewelry & Watches',
    shortLabel: 'Jewelry & Watches',
    title: 'Buy Watches & Jewelry Safely — Verified Sellers Compete',
    description:
      'Post the watch or piece you want and let verified sellers compete with offers. Set authentication and condition requirements. Escrow-protected, free to post.',
    h1: 'Post the piece. Buy with escrow protection.',
    intro:
      'High-value watches and jewelry are exactly where trust matters most. Post the reference you want — model, condition, box-and-papers — and let verified sellers compete. Every payment is held in Stripe escrow until you confirm authenticity, so a grail watch never means sending money on faith.',
    targetSearches: [
      'buy luxury watch safely online',
      'find a specific Rolex reference',
      'where to buy watches with box and papers',
      'get offers on jewelry',
      'authenticated watch marketplace',
    ],
    examples: [
      'Rolex Submariner 124060 — full set, unworn',
      'Omega Speedmaster Professional — 2020+, box & papers',
      'Diamond tennis bracelet — 3ct, certified',
      'Cartier Love ring — size 52, authenticated',
    ],
    faqs: [
      {
        question: 'How do I avoid fakes on high-value watches?',
        answer:
          'Require box, papers, and detailed photos (serial, movement if possible) in your request. Sellers are identity-verified, and escrow means you can have the piece authenticated before you release payment.',
      },
      {
        question: 'Is my payment protected on expensive pieces?',
        answer:
          'Yes. Stripe holds your funds in escrow until you confirm the item is genuine and as described. If something is wrong, you dispute before any money reaches the seller.',
      },
    ],
  },
  {
    slug: 'perfume-and-bath',
    name: 'Perfume & Bath',
    shortLabel: 'Perfume & Bath',
    title: 'Find Discontinued & Rare Fragrances — Sellers Compete',
    description:
      'Post the fragrance or batch you want and let verified sellers compete with offers. Track down discontinued scents. Escrow-protected, free to post.',
    h1: 'Track down the scent — let sellers find it',
    intro:
      'Discontinued formulations, specific batch codes, and hard-to-find niche houses are tough to source. Post exactly what you want — house, concentration, batch, fill level — and let sellers bring you offers. Compare and pay through escrow so a rare bottle purchase stays protected until it lands.',
    targetSearches: [
      'find discontinued perfume',
      'buy a specific fragrance batch code',
      'where to find vintage cologne',
      'get offers on niche fragrance',
      'rare perfume want ad',
    ],
    examples: [
      'Discontinued Creed batch — 90%+ full',
      'Tom Ford Tobacco Vanille — 100ml, sealed',
      'Vintage formulation cologne — any fill',
      'Niche house decant set — authenticated',
    ],
    faqs: [
      {
        question: 'Can I ask for a specific batch or fill level?',
        answer:
          'Yes — specify the batch code, concentration, and minimum fill in your request. Sellers confirm details in their offer and you inspect before releasing escrow.',
      },
      {
        question: 'How are fragrances shipped safely?',
        answer:
          'Sellers handle carrier-compliant packaging and add tracking to every order. Your payment stays in escrow until the bottle arrives as described.',
      },
    ],
  },
];

export function getCategory(slug: string): BuyCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
