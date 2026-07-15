// Blog articles targeting real buyer-intent searches. Each article renders on
// /blog/[slug] and is listed on /blog. Bodies use a small block model so we can
// render headings, paragraphs and lists without a Markdown dependency.
//
// Dates are ISO strings. When you edit an article's substance, bump `updated`.

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export type Article = {
  slug: string;
  title: string;
  /** <meta description> + list excerpt. */
  description: string;
  /** Primary search this piece targets (internal note, not rendered). */
  targetSearch: string;
  published: string;
  updated?: string;
  readMinutes: number;
  body: ArticleBlock[];
};

const CTA: ArticleBlock = {
  type: 'p',
  text:
    'On Surcal you flip the process: post the exact item you want, let verified sellers compete with offers, and pay through Stripe escrow so your money is protected until it arrives. Posting is free — you only pay when you accept an offer.',
};

export const ARTICLES: Article[] = [
  {
    slug: 'how-to-buy-sneakers-below-resale',
    title: 'How to Buy Sneakers Below Resale (Without Getting Faked)',
    description:
      'A practical guide to paying less than StockX or GOAT on the exact pair you want — and how to avoid replicas when you buy sneakers online.',
    targetSearch: 'buy sneakers below resale',
    published: '2026-06-02',
    readMinutes: 6,
    body: [
      {
        type: 'p',
        text:
          'Resale platforms are convenient, but you pay for that convenience twice: once in the platform fee and once in the premium a reseller bakes into every listing. If you know the exact pair you want, there is a cheaper path — make sellers compete for your order instead of shopping theirs.',
      },
      { type: 'h2', text: 'Why resale prices are higher than they need to be' },
      {
        type: 'p',
        text:
          'On a traditional marketplace, the seller sets the price and you either take it or keep scrolling. Add the marketplace commission and authentication fee on top, and a pair that a reseller acquired for $180 can list for $260. You are paying the market’s ceiling, not its floor.',
      },
      { type: 'h2', text: 'Flip the model: post the pair, collect offers' },
      {
        type: 'p',
        text:
          'When multiple verified sellers bid on your specific request — say, “Air Jordan 1 High Chicago, size 10, deadstock” — they compete downward toward the real market price. You see several offers side by side within hours and pick the best one. That competition is the discount.',
      },
      { type: 'h2', text: 'How to avoid fakes when you buy sneakers online' },
      {
        type: 'ul',
        items: [
          'Buy only from identity-verified sellers — anonymous accounts are where replicas hide.',
          'Put your legit-check requirements in the request: tags, box label, stitching, size-tag font.',
          'Ask for time-stamped photos of the actual pair, not stock images.',
          'Use escrow. If your payment is held until you confirm the pair in hand, a bad actor never gets paid.',
        ],
      },
      { type: 'h2', text: 'The bottom line' },
      CTA,
    ],
  },
  {
    slug: 'is-it-safe-to-buy-expensive-electronics-online',
    title: 'Is It Safe to Buy Expensive Electronics from a Stranger Online?',
    description:
      'How escrow, seller verification and tracking make it safe to buy a high-value phone, laptop or camera online — and the red flags to avoid.',
    targetSearch: 'is it safe to buy electronics from a stranger online',
    published: '2026-06-10',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'The fear is reasonable: you send hundreds or thousands of dollars to someone you have never met, and hope a real, working device shows up. The good news is that the safety problem is solved — as long as the transaction is structured correctly.',
      },
      { type: 'h2', text: 'The real risk is the payment, not the person' },
      {
        type: 'p',
        text:
          'Most horror stories share one detail: the buyer paid first, directly, with no recourse. Remove that and the risk collapses. Escrow does exactly this — your money is held by a third party (Stripe) and only released to the seller after you confirm the item arrived and matches the description.',
      },
      { type: 'h2', text: 'What a safe electronics purchase looks like' },
      {
        type: 'ul',
        items: [
          'The seller is identity-verified before they can transact.',
          'Your payment goes into escrow, not the seller’s pocket.',
          'The order has live carrier tracking (USPS/UPS/FedEx).',
          'You inspect the device on arrival before releasing funds.',
          'If it is wrong or never comes, you dispute and get refunded.',
        ],
      },
      { type: 'h2', text: 'Red flags to walk away from' },
      {
        type: 'ul',
        items: [
          'Requests to pay by wire, gift card, or “friends & family” — these have no protection.',
          'Pressure to complete the deal off-platform.',
          'Stock photos only, and refusal to send photos of the actual unit.',
          'Prices far below every other offer, with urgency attached.',
        ],
      },
      { type: 'h2', text: 'A simpler way to buy' },
      CTA,
    ],
  },
  {
    slug: 'what-is-a-reverse-marketplace',
    title: 'What Is a Reverse Marketplace? (And Why Buyers Win)',
    description:
      'A plain-English explanation of the reverse marketplace model — buyers post what they want, sellers compete — and when it beats a traditional marketplace.',
    targetSearch: 'what is a reverse marketplace',
    published: '2026-06-18',
    readMinutes: 4,
    body: [
      {
        type: 'p',
        text:
          'On a normal marketplace, sellers list items and buyers search. A reverse marketplace turns that around: buyers post what they want to buy, and sellers compete to fulfill the request. The demand comes first, and supply chases it.',
      },
      { type: 'h2', text: 'The one-line difference' },
      {
        type: 'p',
        text:
          'Traditional: sellers advertise, buyers hunt. Reverse: buyers advertise, sellers hunt. That flip changes who holds the leverage — and it is the buyer.',
      },
      { type: 'h2', text: 'Why buyers come out ahead' },
      {
        type: 'ul',
        items: [
          'Price discovery: multiple sellers bidding on your exact request reveals the true market price, not the highest asking price.',
          'No endless searching: you describe the item once instead of refreshing listings for weeks.',
          'Exact match: you set the condition, specs and price up front, so offers come pre-qualified.',
          'Access to hidden inventory: sellers surface items that were never publicly listed.',
        ],
      },
      { type: 'h2', text: 'When a reverse marketplace is the right tool' },
      {
        type: 'p',
        text:
          'It shines when you know exactly what you want but it is hard to find at a fair price — a specific sneaker size, a discontinued part, a graded card, a sold-out console. For impulse browsing, a traditional marketplace is fine. For a targeted purchase, letting sellers compete is almost always cheaper.',
      },
      { type: 'h2', text: 'Try it on your next hard-to-find purchase' },
      CTA,
    ],
  },
  {
    slug: 'how-escrow-protects-online-buyers',
    title: 'How Escrow Protects Online Buyers (Explained Simply)',
    description:
      'What escrow is, how it works step by step, and why it removes the risk from high-value peer-to-peer purchases like watches, electronics and collectibles.',
    targetSearch: 'how does escrow protect buyers',
    published: '2026-06-24',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'Escrow is a simple idea that solves the oldest problem in commerce: neither side wants to go first. The buyer does not want to pay before receiving the item; the seller does not want to ship before being paid. Escrow sits in the middle and holds the money until both obligations are met.',
      },
      { type: 'h2', text: 'How escrow works, step by step' },
      {
        type: 'ul',
        items: [
          'You agree on a price and pay — but the money goes to escrow, not the seller.',
          'The escrow provider (Stripe, in Surcal’s case) confirms the funds are held.',
          'The seller ships the item and adds tracking, knowing payment is secured.',
          'You receive and inspect the item.',
          'You confirm it is as described, and only then is the money released.',
          'If something is wrong, you dispute before releasing — the seller has not been paid.',
        ],
      },
      { type: 'h2', text: 'Why it matters most for high-value items' },
      {
        type: 'p',
        text:
          'A $30 impulse buy is a small risk. A $2,000 watch or a graded grail card is not. Escrow scales protection to the price: the more money on the line, the more valuable it is that the seller cannot touch it until you are satisfied.',
      },
      { type: 'h2', text: 'Escrow vs. buyer “protection” programs' },
      {
        type: 'p',
        text:
          'Many platforms advertise buyer protection but still pay the seller immediately, leaving you to claw money back through a claims process. True escrow is stronger because the default state is that the seller has not been paid yet — you are not fighting to recover funds, you are simply choosing whether to release them.',
      },
      { type: 'h2', text: 'Buy with escrow by default' },
      CTA,
    ],
  },
  {
    slug: 'how-to-find-hard-to-find-and-sold-out-items',
    title: 'How to Find Hard-to-Find or Sold-Out Items Online',
    description:
      'Tactics for tracking down discontinued, sold-out or rare items — and why posting a want ad beats endless searching.',
    targetSearch: 'how to find sold out or discontinued items',
    published: '2026-07-01',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'Some things are not hard to buy — they are hard to find. Discontinued appliances, sold-out sneakers, a specific OEM part, a vaulted collectible. When the item exists but the listing does not, searching harder is not the answer. Making yourself findable to sellers is.',
      },
      { type: 'h2', text: 'The problem with searching' },
      {
        type: 'p',
        text:
          'Search only surfaces what someone has already chosen to list publicly. The best inventory for rare items often sits in private hands, dealer back-stock, or collections that never hit a marketplace. No amount of refreshing reveals what was never posted.',
      },
      { type: 'h2', text: 'Post a want ad and let supply find you' },
      {
        type: 'p',
        text:
          'Instead of searching listings, publish a detailed request describing exactly what you want. Sellers who have it — including ones who would never have bothered to create a listing — can come to you with an offer. You have effectively broadcast demand to the people holding supply.',
      },
      { type: 'h2', text: 'How to write a request that gets results' },
      {
        type: 'ul',
        items: [
          'Be specific: exact model, size/spec, condition, and any identifiers (part number, batch code, grade).',
          'Add reference photos so sellers can match precisely.',
          'Set a realistic target price — competition will sharpen it, but a fantasy number gets ignored.',
          'State your must-haves (OEM only, box and papers, minimum grade) so offers arrive pre-filtered.',
        ],
      },
      { type: 'h2', text: 'Stop searching, start posting' },
      CTA,
    ],
  },
  {
    slug: 'how-to-buy-a-luxury-watch-safely-online',
    title: 'How to Buy a Luxury Watch Safely Online',
    description:
      'A buyer’s checklist for purchasing a Rolex, Omega or other luxury watch online without getting burned — authentication, box and papers, and escrow.',
    targetSearch: 'how to buy a luxury watch safely online',
    published: '2026-07-08',
    readMinutes: 6,
    body: [
      {
        type: 'p',
        text:
          'A luxury watch is one of the highest-stakes purchases you can make peer-to-peer: high value, sophisticated counterfeits, and irreversible if you pay the wrong person. It is also entirely doable safely if you follow a disciplined process.',
      },
      { type: 'h2', text: 'Decide exactly what you want first' },
      {
        type: 'p',
        text:
          'Nail down the reference number, not just the model. “Rolex Submariner” is not enough — 124060 vs 126610LN vs an older 114060 differ in size, movement and value. Knowing the reference lets you compare offers apples-to-apples and spot a seller who does not actually know the piece.',
      },
      { type: 'h2', text: 'Require box, papers and the right photos' },
      {
        type: 'ul',
        items: [
          'Ask for the original box and papers (or price accordingly if it is a watch-only sale).',
          'Request clear photos of the serial and model numbers, dial, caseback and clasp.',
          'For anything in doubt, plan to have it authenticated by a watchmaker before you commit.',
        ],
      },
      { type: 'h2', text: 'Never pay the seller directly' },
      {
        type: 'p',
        text:
          'This is the rule that protects everything else. With escrow, your payment is held until you confirm the watch is genuine and as described. On a five-figure purchase, the ability to authenticate before releasing funds is not a nice-to-have — it is the whole game.',
      },
      { type: 'h2', text: 'Let verified sellers compete' },
      {
        type: 'p',
        text:
          'Posting your target reference and letting identity-verified sellers bid does two things at once: it surfaces well-priced pieces you would not find in listings, and it keeps you in control of the terms — authentication, condition, and when the money moves.',
      },
      { type: 'h2', text: 'Buy your grail the safe way' },
      CTA,
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
