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
  {
    slug: 'how-to-buy-graded-trading-cards',
    title: 'How to Buy Graded Trading Cards Without Overpaying',
    description:
      'A buyer’s guide to PSA, BGS and SGC graded cards — reading slabs, spotting tampering, fair pricing, and how to get cards below comps.',
    targetSearch: 'how to buy graded trading cards',
    published: '2026-09-02',
    readMinutes: 6,
    body: [
      {
        type: 'p',
        text:
          'Graded cards are one of the easiest collectibles to buy well and one of the easiest to overpay for. The slab gives you a certificate number, a grade and a paper trail — but only if you actually check them. Here is how to buy graded cards with confidence.',
      },
      { type: 'h2', text: 'Verify the slab before anything else' },
      {
        type: 'ul',
        items: [
          'Look up the cert number on the grader’s official registry (PSA, BGS, SGC each have one).',
          'Confirm the card, set, year and grade on the label match the cert record exactly.',
          'Compare the slab’s label font, hologram and seams against known examples — fake slabs exist.',
          'Be suspicious of blurry cert photos; ask for a straight-on, readable shot.',
        ],
      },
      { type: 'h2', text: 'Price against recent comps, not asking prices' },
      {
        type: 'p',
        text:
          'Listings show what sellers hope to get; comps show what cards actually sold for. Check the last 30–90 days of sales for the same card and grade, and adjust for centering qualifiers or population. If a listing is far above comps, it is waiting for an uneducated buyer — do not be that buyer.',
      },
      { type: 'h2', text: 'Watch for the common traps' },
      {
        type: 'p',
        text:
          'Grade bumps misrepresented cross-graders (an SGC 9 is not a PSA 9), trimmed cards hiding inside older slabs, and “raw” cards described with a projected grade. The cleanest defense is to buy the slab, verify the cert, and ignore seller projections entirely.',
      },
      { type: 'h2', text: 'Let dealers compete for your card money' },
      {
        type: 'p',
        text:
          'Instead of chasing listings, post the exact card and grade you want — “2020 Prizm LeBron Silver PSA 10, no qualifiers” — and let verified dealers and collectors bid. Breaking-news: the dealer who needs cash that week often comes in under comps. Pay through escrow so the slab must pass your cert check before money moves.',
      },
      { type: 'h2', text: 'Build the collection the smart way' },
      CTA,
    ],
  },
  {
    slug: 'used-phone-buyers-checklist',
    title: 'Used Phone Buyer’s Checklist: What to Verify Before You Pay',
    description:
      'The exact checks to run before buying a used iPhone or Android — IMEI, battery health, carrier locks, and how to pay safely.',
    targetSearch: 'used phone buyer checklist',
    published: '2026-09-09',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'A used phone can be a great deal or a very expensive paperweight. The difference is a ten-minute checklist. Run through every item below before money changes hands and the vast majority of used-phone scams simply cannot happen to you.',
      },
      { type: 'h2', text: 'The checks that matter' },
      {
        type: 'ul',
        items: [
          'IMEI: get it from the seller and run it through a checker — confirm it is not blacklisted, stolen or financed.',
          'Carrier lock: verify the phone is unlocked, or price in the unlock requirements.',
          'iCloud / Google account: the account must be signed out before you pay. An activation-locked phone is a brick.',
          'Battery health: ask for a screenshot (Settings → Battery). Under 80% means a replacement is due.',
          'Water damage: check the SIM tray indicator and ask about repair history.',
          'Photos: request pictures of the actual device, settings screens and IMEI, not stock images.',
        ],
      },
      { type: 'h2', text: 'Why “checked on arrival” beats “trusted the seller”' },
      {
        type: 'p',
        text:
          'Even an honest seller can miss something. The structure that protects you is escrow: your payment is held until the phone arrives and you have run this checklist in person. If the IMEI comes back blacklisted, you dispute — the seller was never paid. No chargeback race, no he-said-she-said.',
      },
      { type: 'h2', text: 'Getting a better price than the refurb stores' },
      {
        type: 'p',
        text:
          'Refurbishers price with a margin for warranty and overhead. Individual sellers and small repair shops often have exactly the model you want and will go lower — if they are competing for your order. Post the model, storage, color and minimum battery health, and let offers come to you.',
      },
      { type: 'h2', text: 'Buy your next phone the protected way' },
      CTA,
    ],
  },
  {
    slug: 'how-to-find-discontinued-car-parts',
    title: 'How to Find Discontinued or Hard-to-Find Car Parts',
    description:
      'Strategies for sourcing OEM and discontinued auto parts — part numbers, interchange guides, salvage networks, and how a want ad finds hidden stock.',
    targetSearch: 'how to find discontinued car parts',
    published: '2026-09-16',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'Every car owner eventually hits it: the dealer says the part is discontinued, and the aftermarket does not make it. The part still exists — in dealer back-stock, on salvage vehicles, in collector garages. The challenge is finding who has it.',
      },
      { type: 'h2', text: 'Start with the exact part number' },
      {
        type: 'p',
        text:
          '“Water pump for a 1998 4Runner” gets you guesses; the OEM part number gets you the part. Pull it from the old part, the parts diagram in the dealer catalog, or an interchange guide. A request with the exact number is instantly fulfillable by any seller who has it on a shelf.',
      },
      { type: 'h2', text: 'Where discontinued parts actually hide' },
      {
        type: 'ul',
        items: [
          'Dealer old-stock: parts superseded or discontinued years ago, still sealed in original packaging.',
          'Salvage yards and part-out sellers: body panels, trim, interior pieces, and electronics from donor vehicles.',
          'Collector and enthusiast communities: hoards of NOS (new old stock) parts that never get listed anywhere.',
          'Overseas suppliers: markets where your vehicle was sold longer sometimes still stock the part.',
        ],
      },
      { type: 'h2', text: 'Broadcast demand instead of searching supply' },
      {
        type: 'p',
        text:
          'Searching only reaches sellers who already created a listing — a fraction of who actually holds the part. Posting a detailed request with the part number, vehicle (year/make/model/trim) and condition requirements reaches the rest: the salvage seller deciding what to pull next, the collector willing to part with a shelf, the dealer clearing old stock. Offers arrive, you compare, and escrow keeps the payment safe until the part is in your hands and matches.',
      },
      { type: 'h2', text: 'Keep the car on the road' },
      CTA,
    ],
  },
  {
    slug: 'how-to-buy-perfume-online-without-getting-faked',
    title: 'How to Buy Perfume Online Without Getting a Fake',
    description:
      'How to spot counterfeit fragrances when buying online — batch codes, packaging tells, seller red flags, and how to pay safely for hard-to-find scents.',
    targetSearch: 'how to spot fake perfume online',
    published: '2026-09-23',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'Fragrance is one of the most counterfeited categories online. Fakes have gotten good — convincing bottles, believable boxes — but they still fail a handful of checks that take minutes to run. Learn them before you buy, not after.',
      },
      { type: 'h2', text: 'Verify the batch code' },
      {
        type: 'p',
        text:
          'Every legitimate bottle has a batch code printed or etched on the glass and matching the box. Look the code up in a batch decoder: it should map to a production date consistent with the listing, and the box and bottle codes should match each other. A mismatch, or a code that decodes to nothing, is a dealbreaker.',
      },
      { type: 'h2', text: 'Inspect the details fakes get wrong' },
      {
        type: 'ul',
        items: [
          'Cellophane: tight, clean seams and a proper stamp — loose or crooked wrap is a tell.',
          'Box: correct font, spacing, color, and country of manufacture for the brand.',
          'Bottle: weight, spray mechanism, cap fit, and the quality of the engraving or label.',
          'Ask the seller for photos of the actual bottle: batch code, box, and sprayer close-ups.',
        ],
      },
      { type: 'h2', text: 'Discontinued and vaulted fragrances' },
      {
        type: 'p',
        text:
          'The hardest purchases are the discontinued gems and reformulation-era originals collectors chase. These rarely appear listed at fair prices — but plenty of collectors and decant sellers hold them. Post the exact fragrance, concentration and vintage you want and let holders make offers; escrow means a bottle that fails the batch-code check never costs you the money.',
      },
      { type: 'h2', text: 'Smell great, spend smart' },
      CTA,
    ],
  },
  {
    slug: 'how-to-buy-gold-jewelry-online',
    title: 'How to Buy Gold Jewelry Online: Purity, Pricing and Trust',
    description:
      'What to check when buying gold jewelry online — karat stamps, weight-based pricing, hallmark verification, and how escrow protects high-value pieces.',
    targetSearch: 'how to buy gold jewelry online safely',
    published: '2026-09-30',
    readMinutes: 5,
    body: [
      {
        type: 'p',
        text:
          'Gold jewelry is a commodity wearing a bow: most of the price is the metal, and the metal is measurable. That makes it very hard to overpay — if you know the three numbers that matter: purity, weight, and the spot price.',
      },
      { type: 'h2', text: 'Know the three numbers' },
      {
        type: 'ul',
        items: [
          'Purity: karat stamp (10K/14K/18K/22K) or hallmark. 14K is 58.5% gold, 18K is 75% — the rest is alloy and priced accordingly.',
          'Weight in grams: no grams listed means no way to sanity-check the price. Always ask.',
          'Gold spot price: multiply weight × purity × spot to get the melt value. Retail sits above melt; how far above depends on craftsmanship and brand.',
        ],
      },
      { type: 'h2', text: 'Verify before you pay, not after' },
      {
        type: 'p',
        text:
          'Ask for photos of the hallmark, the full piece on a scale showing the weight, and any appraisal or receipt that exists. Buy from identity-verified sellers, and use escrow so the payment is held while you have the piece tested or appraised on arrival. On high-karat and heavy pieces, a quick acid or XRF test at a local jeweler costs little and settles everything.',
      },
      { type: 'h2', text: 'Better prices than the mall counter' },
      {
        type: 'p',
        text:
          'Branded retail carries a large markup over melt. Independent makers, estate sellers and gold dealers often sell the same purity for much less — especially when several of them are bidding on your request instead of setting a price for you to take. Post the karat, weight range and style you want and let the market come back with numbers.',
      },
      { type: 'h2', text: 'Buy gold with confidence' },
      CTA,
    ],
  },
  {
    slug: 'marketplace-fees-who-really-pays',
    title: 'Marketplace Fees Explained: Who Really Pays?',
    description:
      'How marketplace and resale platform fees get baked into every price you see — and how fee structure changes what an item actually costs you.',
    targetSearch: 'marketplace fees explained',
    published: '2026-10-07',
    readMinutes: 4,
    body: [
      {
        type: 'p',
        text:
          'When a platform charges the seller 10–15%, it is tempting to think the fee is the seller’s problem. It is not. Sellers are businesses: every fee is priced into the listing before you ever see it. The buyer always pays, one way or another.',
      },
      { type: 'h2', text: 'Where fees hide' },
      {
        type: 'ul',
        items: [
          'Seller commissions (often 8–15%) — baked directly into the asking price.',
          'Payment processing (about 3%) — added at checkout or embedded in the price.',
          'Authentication / verification fees — common on sneakers, watches and cards.',
          'Shipping and handling margins — padded to cover picking, packing and platform costs.',
        ],
      },
      { type: 'h2', text: 'The listing price is a negotiation against you' },
      {
        type: 'p',
        text:
          'On a seller-first marketplace, the seller sets the price to cover acquisition cost, fees, and profit — with room to spare. You see one number and take it or leave it. Multiple sellers listing the same item does not create real competition, because each one prices independently, above their cost floor.',
      },
      { type: 'h2', text: 'Real competition is bidders, not listings' },
      {
        type: 'p',
        text:
          'When sellers bid on your specific request, the dynamic flips: each offer is made knowing others are bidding, so prices converge toward the seller’s true floor instead of drifting up toward your ceiling. Combine that with transparent, buyer-side escrow and you can see the actual cost of the item — not a price inflated to cover a fee you never see.',
      },
      { type: 'h2', text: 'See real prices on your next purchase' },
      CTA,
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
