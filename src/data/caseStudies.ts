
export type ProjectKind = 'commercial' | 'commercial-concept' | 'redesign-concept' | 'concept-for-sale' | 'passion'

export const projectKindLabel: Record<ProjectKind, string> = {
  'commercial': 'Commercial',
  'commercial-concept': 'Commercial concept',
  'redesign-concept': 'Redesign concept',
  'concept-for-sale': 'Concept · open for purchase',
  'passion': 'Passion project',
}

export interface CaseStudyMetric {
  label: string
  value: string
  verified: boolean
}

export interface CaseStudySection {
  id: 'problem' | 'constraints' | 'what-i-did' | 'outcome' | 'what-i-took-from-it'
  heading: string
  body: string
}

export interface CaseStudy {
  id: string
  title: string
  client: string
  kind: ProjectKind
  eyebrow: string
  headline: string
  summary: string
  metrics: CaseStudyMetric[]
  sections: CaseStudySection[]
  stack: string[]
  video?: string
  poster: string
  live?: string
  repo?: string
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'the-venue-menu',
    title: 'The Venue Menu',
    client: 'The Venue Menu (Kaga Gardens)',
    kind: 'commercial',
    eyebrow: 'Full-stack development · Wedding vendor discovery · Kampala, Uganda',
    headline: 'Uganda\'s wedding vendor discovery platform, built end to end',
    summary:
      'A searchable directory of Kampala wedding vendors and venues, curated with Kaga Gardens, that I built and still run.',
    metrics: [
      { label: 'Vendor categories', value: '13 categories', verified: true },
      { label: 'Admin', value: 'Vendor and waitlist dashboard', verified: true },
      { label: 'Shortlist', value: 'Saved vendors shared over WhatsApp', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'Kampala wedding couples had no single place to find and compare vendors, venues, caterers, photographers, decorators, by price, capacity, and real reviews. Vendors themselves had no shared platform to be found on.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'No existing dataset of Kampala vendors to start from. Every price needed to read in UGX, not USD. The whole thing had to run on a real database with public read access and a private admin, not a static brochure site.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Designed and built the whole product on React 19, TypeScript, and Vite, with Supabase for the database, auth, and storage.\n- Modelled 13 vendor categories, with extra fields for venues specifically: seating capacity, parking, catering policy, accommodation.\n- Built a data pipeline that pulls vendor listings from Google Places, then enriches descriptions and taglines with OpenAI.\n- Added a shortlist feature, backed by Zustand, so a couple can save vendors and share the list over WhatsApp.\n- Built the admin dashboard Kaga Gardens uses directly to manage vendors and read waitlist signups, with row-level security controlling who can write.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. The platform is live and Kaga Gardens manages it directly through the admin dashboard; visitor and booking numbers are not yet tracked.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'Owning a product end to end, not just the code, taught me how much of "done" is actually the data pipeline and the admin someone else has to use every day.',
      },
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'Zustand', 'React Router', 'OpenAI API'],
    video: '/case-studies/the-venue-menu/walkthrough.mp4',
    poster: '/case-studies/the-venue-menu/poster.webp',
    live: 'https://the-venue-menu.vercel.app',
    repo: 'https://github.com/TheyloveShaka/TheVenueMenu',
  },
  {
    id: 'etaxi',
    title: 'eTaxi',
    client: 'eTaxi (concept, not a live service)',
    kind: 'passion',
    eyebrow: 'Concept pitch site · Electric public transport · Kampala, Uganda',
    headline: 'An electric 14-seater taxi that drives down the page as you scroll',
    summary:
      'A one-page scroll story pitching electric public taxis for Kampala, with a rider app, a 44-page proposal and a 5-page executive summary behind it.',
    metrics: [
      { label: 'Format', value: 'One-page scroll story', verified: true },
      { label: 'Proposal', value: '44-page proposal, 5-page summary', verified: true },
      { label: 'Research', value: '124 cited sources', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'Kampala\'s public taxis are the blue and white vans people flag down every day. The pitch for an electric 14-seater had to start from that familiar sight, not from a foreign gadget, and show a rider what changes for them.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'No eTaxis are running yet, so the page says so plainly, and the fares on the phone screens are examples. No invented statistics: the proposal\'s taxi count and van price stay unknown by design. Uganda drives on the left, so the van holds the screen-right lane as it heads down the page. The van artwork is generated, with the roof sign and roundel drawn in by script.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Built the whole page as one scroll story: the van rolls in from the right on load, turns onto a vertical road, passes six stages, and arrives at a full-bleed photo.\n- Drove it with one sticky view, one scrubbed GSAP timeline and a camera-driven world layer, with no ScrollTrigger pins.\n- Wrote the proposal behind it: a 44-page full proposal and a 5-page executive summary with 124 sources, rendered to PDF from HTML and linked from a concept page.\n- Gave reduced-motion, Save-Data and no-JavaScript visitors a static stack of the same story instead of the animation.\n- Made the phone-app screens inert and labelled as images, so they never take keyboard focus.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. This is a concept pitch and no eTaxis are running. The site is live on GitHub Pages, and its Get updates buttons open the concept page that carries both PDFs.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'A pitch is more convincing when it says what it does not know yet. Leaving the taxi count and van price open, and marking fares as examples, kept every number on the page honest.',
      },
    ],
    stack: ['TypeScript', 'Vite', 'GSAP', 'CSS', 'Python', 'Playwright'],
    video: '/case-studies/etaxi/walkthrough.mp4',
    poster: '/case-studies/etaxi/poster.webp',
    live: 'https://theyloveshaka.github.io/etaxi/',
    repo: 'https://github.com/TheyloveShaka/etaxi',
  },
  {
    id: 'eden-of-kora',
    title: 'Eden of Kora',
    client: 'Eden of Kora (Aaron Ndikora)',
    kind: 'commercial',
    eyebrow: 'Website build · Florist · Kampala, Uganda',
    headline: 'A Kampala florist site where the thought is the gift and the order goes over WhatsApp',
    summary:
      'A six-page site for Eden of Kora, a delivery-only florist in Kampala, with UGX prices, a video-first home page, a gallery and a corporate page.',
    metrics: [
      { label: 'Pages', value: '6 pages, no build step', verified: true },
      { label: 'Ordering', value: 'WhatsApp, paid before delivery', verified: true },
      { label: 'Hours', value: 'Open daily, 9am to 7pm', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'Eden of Kora started in 2025 and sells fresh bouquets, funeral and sympathy flowers, gift hampers, preserved flowers, subscriptions and office arrangements across Kampala, delivery only. It needed a site that sounds like its owner, who says flowers are not the gift, the thought of giving them is.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'The client\'s facts came first. Prices, numbers, contacts and his words come only from his brief. His unconfirmed "85+" figure is not shown, there are no reviews because none were supplied, and there is no walk-in shop because there is none. Ordering had to stay on WhatsApp, with payment before delivery by MTN MoMo, Airtel Money, bank transfer or card, and no cash on delivery. The look is soft pink and cream, modern and playful, with not too much wording.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Built six pages in plain HTML, CSS and vanilla JavaScript with no build step: home, shop, about, contact, gallery and corporate, all on one set of design tokens.\n- Opened the home page on video, as he asked, with a horizontal filmstrip of recent arrangements and reduced-motion handling.\n- Wrote a cart that turns an order into a pre-filled WhatsApp message asking for what his orders need: sender and recipient names and phones, address, date and time, card message and special requests.\n- Re-encoded his supplied videos for the web and added a corporate page whose quote form opens WhatsApp.\n- Kept a launch sweep that blocks any stand-in product, so nothing ships with a placeholder price.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. The site is live as a preview, and launch on the client\'s own domain is still pending.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'When the client\'s facts are the product, the job is mostly knowing what to leave out. Every number I could not confirm stayed off the page.',
      },
    ],
    stack: ['HTML', 'CSS', 'JavaScript'],
    video: '/case-studies/eden-of-kora/walkthrough.mp4',
    poster: '/case-studies/eden-of-kora/poster.webp',
    live: 'https://theyloveshaka.github.io/eden-of-kora/',
  },
  {
    id: 'uwa',
    title: 'Uganda Wildlife Authority',
    client: 'Uganda Wildlife Authority (speculative, unaffiliated)',
    kind: 'redesign-concept',
    eyebrow: 'Speculative redesign · Conservation & tourism · Uganda\'s national parks',
    headline: 'Ten national parks, told as ten different landscapes instead of one grid',
    summary:
      'A speculative redesign of ugandawildlife.org\'s front page, not affiliated with, commissioned by, or endorsed by UWA.',
    metrics: [
      { label: 'Parks', value: '10 national parks', verified: true },
      { label: 'Image weight', value: 'Park photos optimised 4.09MB to 1.57MB', verified: true },
      { label: 'Hero video', value: 'Gated by screen width, connection and reduced motion', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'The existing site flattened ten genuinely different landscapes, gorillas, savannah, the Nile, into one grid of identical tiles, behind a heavy mega-menu.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'This is not a commissioned project. UWA\'s own photographs are copyrighted and used here only to demonstrate the design, so the repository stays private and every asset carries a documented replacement plan.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Designed the Park Strip, ten vertical panels that expand on hover or keyboard focus, where each park\'s name is masked beneath its own photograph so the image physically interrupts the letters.\n- Drew Uganda\'s actual national boundary from OpenStreetMap data as a single lightweight path, and placed each park on it as a real position rather than a marker in an outline.\n- Gated the hero video behind screen width, connection speed, and reduced-motion preference, so a visitor on 3G still gets a fast, complete page with a still image instead.\n- Left two pages that publish no content on the live site as honest \'content pending\' states, rather than inventing copy UWA never wrote.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. This is a speculative redesign, not UWA\'s live site, and the repository is kept private for photo licensing reasons.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'Depth can come from masking a real photograph instead of a drop shadow. Restraint everywhere else is what let the one bold idea land.',
      },
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'GSAP'],
    video: '/case-studies/uwa/walkthrough.mp4',
    poster: '/case-studies/uwa/poster.webp',
    repo: 'https://github.com/TheyloveShaka/uwa-redesign',
  },
  {
    id: 'frozen-basket',
    title: 'Frozen Basket',
    client: 'Frozen Basket',
    kind: 'concept-for-sale',
    eyebrow: 'Front-end rebuild · Dessert & ice cream retail · Kisementi, Kampala',
    headline: 'A candy-coloured menu of 178 flavours that still passes contrast checks',
    summary:
      'A new concept, open for purchase, for frozenbasketug.com, built around the shop\'s own 43 menu groups and 178 flavours, not a generic ice cream template.',
    metrics: [
      { label: 'Menu', value: '178 flavours, 43 groups', verified: true },
      { label: 'Palette', value: '10-colour token system, 58 tinted flavours', verified: true },
      { label: 'Layout shift', value: '0.000 CLS on both routes', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'Frozen Basket\'s real menu, 178 flavours across ice cream, boba, waffles, and crepes, had no way to be browsed online beyond a generic framework template, and the site\'s own metadata quoted a price range its actual menu didn\'t match.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'Every price, category name, and photograph had to come from the client\'s own menu data, verbatim, with no re-categorising or tidying. No backend and no cart, so ordering still routes through a real conversation with the shop.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Modelled the full menu, 43 groups and 178 flavours, from the client\'s own menu PDF into structured data, instead of a flat product grid.\n- Built a ten-colour token system with pastel ingredient tints for 58 flavours, so a candy palette still clears WCAG AA text contrast.\n- Designed three states for product photography, cut out, windowed behind glass, and a plinth-only placeholder for the one flavour with no photo, so a missing asset never looks like a broken image.\n- Held both routes to zero layout shift, verified against a production build rather than the dev server.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. This is a concept, not the shop\'s current site.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'A ten-colour palette and 58 flavours aren\'t a contradiction if you\'re strict about which layer text is allowed to sit on.',
      },
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Playwright'],
    video: '/case-studies/frozen-basket/walkthrough.mp4',
    poster: '/case-studies/frozen-basket/poster.webp',
    repo: 'https://github.com/TheyloveShaka/frozen-basket',
  },
  {
    id: 'premium-liquor',
    title: 'Premium Liquor',
    client: 'Premium Liquor',
    kind: 'concept-for-sale',
    eyebrow: 'Concept · Wine & spirits retail · Lugogo, Kampala',
    headline: 'A bottle carousel that re-themes the whole page to whatever you\'re looking at',
    summary:
      'A concept open for purchase for thepremiumliquor.com, where swiping through bottles changes the page\'s colours to match each one\'s own branding.',
    metrics: [
      { label: 'Ordering', value: 'WhatsApp checkout, no backend', verified: true },
      { label: 'Prices', value: 'Sourced from the brand\'s own live menu', verified: true },
      { label: 'Images', value: 'Bottle PNGs compressed to two WebP sizes', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'The brand\'s actual product, rare wines and spirits with real personality per bottle, had no way to show off any single bottle; a generic grid treats a rare cognac the same as a shelf staple.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'No backend and no payments. Every price came from the live site\'s own menu page and had to stay accurate to it. Ordering can only route through WhatsApp.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Built a side-to-side bottle carousel, swipe on phone, arrows or keys on desktop, where the whole page\'s theme shifts to match the bottle\'s own branding as you move.\n- Sampled the company\'s ink-and-copper wordmark to build the fixed theme the rest of the site, About, storefront, contact, sits on.\n- Wired every \'Order Now\' to a WhatsApp deep link pre-filled with the item, so an interested visitor reaches an actual person, not a dead cart.\n- Wrote an image pipeline that compresses bottle PNGs into two sizes of WebP and storefront photos into WebP automatically.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body: 'Outcome not yet measured. This is a concept, not the brand\'s current live site.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'Letting the page\'s own colour react to what you\'re looking at made browsing bottles feel physical instead of like scrolling a list.',
      },
    ],
    stack: ['Vite', 'Preact', 'GSAP', 'Lenis'],
    video: '/case-studies/premium-liquor/walkthrough.mp4',
    poster: '/case-studies/premium-liquor/poster.webp',
    repo: 'https://github.com/TheyloveShaka/Premium-liquor',
  },
  {
    id: 'bulungi-town-arcade',
    title: 'Bulungi Town Arcade',
    client: 'Bulungi Town (Café, Arcade, Soft Play)',
    kind: 'commercial-concept',
    eyebrow: 'Launch site concept · Family entertainment · Lugogo Mall, Kampala',
    headline: 'A launch site for a Kampala arcade where the page itself has three playable games',
    summary:
      'A v1 demo launch site for Bulungi Town with an 8-bit arcade built in: three mini-games on one cabinet and a leaderboard on each device.',
    metrics: [
      { label: 'Games', value: '3 mini-games in one cabinet', verified: true },
      { label: 'Leaderboard', value: 'Top 50 scores kept per game, per device', verified: true },
      { label: 'Game assets', value: 'All sprites in code, all sounds synthesised', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'A café, arcade and soft play venue at Lugogo Mall sells play, and a generic venue template cannot show that. The launch site needed to feel like the place itself and give a visitor something to do before they book.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'Brand colours come from the official logo: royal blue, sky cyan and sun yellow. The site is one page with no build step, bookings go to WhatsApp, and every editable detail lives in one data file. Prices, testimonials and the WhatsApp number are demo values, and the social handles are unconfirmed guesses, until the client supplies the real ones.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Built a playable cabinet into the page with three games: Bulungi Blast, a token catcher with a choice of two characters, Pixel Bowling over five racks, and Mini Golf over three holes, the last with a moving wall.\n- Drew every sprite as an in-code pixel map and synthesised every sound, so the games add no asset files.\n- Added a per-device leaderboard stored in the browser, a reward prompt when a score passes a threshold, and a WhatsApp link to share the score.\n- Masked the hero media with an irregular organic shape outlined in cyan, and made every photo and video slot fill itself when a correctly named file is dropped into the assets folder.\n- Put prices, party packages, weekly deals, hours and the reward offer in one file, so the client can edit them without touching the code.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. This is a v1 demo. Real promo footage and real prices are still to come, and the leaderboard stays per device until a small backend is added.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'Putting a game inside the venue site lets a visitor try the place before they book. Keeping every sprite and sound in code meant the games needed no asset files.',
      },
    ],
    stack: ['HTML', 'CSS', 'JavaScript'],
    video: '/case-studies/bulungi-town-arcade/walkthrough.mp4',
    poster: '/case-studies/bulungi-town-arcade/poster.webp',
    repo: 'https://github.com/TheyloveShaka/Rep.Shaka',
  },
  {
    id: 'hotel-site',
    title: 'Kaga Kampala',
    client: 'Kaga Kampala (speculative, fictional concept)',
    kind: 'passion',
    eyebrow: 'Concept prototype · Immersive hotel experience · Kampala, Uganda',
    headline: 'A hotel site where scrolling is a walk through the building, not a menu',
    summary:
      'A speculative concept for a fictional Kampala hotel, where the elevator is the navigation and every floor opens onto a different part of the building.',
    metrics: [
      { label: 'Stage', value: 'Figma clickable prototype', verified: true },
      { label: 'Structure', value: '4 scroll chapters', verified: true },
      { label: 'Build status', value: 'Generated stills and video, coded build not started', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'A hotel site that just lists rooms and a booking form doesn\'t give a guest any sense of the place itself before they arrive.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'Kaga Kampala is a fictional property, invented for this concept, not a real, bookable business. Every shot had to stay in one lighting state, dusk into blue hour, and one building, an ivory-stone tower, with no other brand name in any image.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Designed the journey as four chapters, arrival, reception, an elevator, and the room or facility a guest chooses, so navigation is a physical act inside the building rather than a menu bar.\n- Specified every generated image and video clip frame by frame, locking the building, the lighting, and the camera angle so continuity holds across the whole sequence.\n- Built the concept as a clickable Figma prototype first, with the coded, scroll-driven build planned to follow once the direction is approved.\n- Set every sign in every generated image to read \'Kaga Kampala\' and nothing else, so no other brand leaks into the fiction.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body:
          'Outcome not yet measured. This is a concept prototype for a fictional hotel, not a commissioned or bookable property.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'Making navigation a physical act, an elevator instead of a menu, only works if you\'re willing to plan every single frame around it.',
      },
    ],
    stack: ['Figma'],
    video: '/case-studies/hotel-site/walkthrough.mp4',
    poster: '/case-studies/hotel-site/poster.webp',
    live: 'https://kaga-kampala-opal.vercel.app',
  },
  {
    id: 'kamwe-forex',
    title: 'Kamwe Forex',
    client: 'Kamwe Forex Bureau',
    kind: 'redesign-concept',
    eyebrow: 'Brand-adherence rebuild · Forex bureau · Kampala, Uganda',
    headline: 'A live rate board for a Bank of Uganda licensed forex bureau',
    summary:
      'A redesign concept for kamweforex.com that puts real-time exchange rates first and never shows a live clock over stale numbers.',
    metrics: [
      { label: 'Currencies', value: '7 currencies quoted', verified: true },
      { label: 'Motion', value: 'Two distinct scroll gestures', verified: true },
      { label: 'Rate labels', value: 'Every number marked live, fallback or stale', verified: true },
    ],
    sections: [
      {
        id: 'problem',
        heading: 'Problem',
        body:
          'The live site printed a running clock above exchange rates that were hardcoded from 2023, so a visitor read three-year-old numbers as today\'s. Foreign exchange, the bureau\'s core product, didn\'t appear in the main navigation at all.',
      },
      {
        id: 'constraints',
        heading: 'Constraints',
        body:
          'Every string of copy had to stay exactly as the client wrote it, including source typos (\'Logogo\' for Lugogo, \'Todays Exchange Rates\' with no apostrophe). No database, no admin, the client sets rates manually today.',
      },
      {
        id: 'what-i-did',
        heading: 'What I did',
        body:
          '- Rebuilt the rate board to pull live mid-market rates from a currency API, with a fallback source, labelling every number honestly as live, fallback, or stale.\n- Gave the bureau\'s own buy and sell spread its own config file, so the markup that funds the business is legible instead of hidden.\n- Designed two distinct motion gestures, EXCHANGE (a swap) and TRANSFER (a one-way trip), so Forex Exchange and Money Transfer feel like different actions, not two buttons doing the same thing.\n- Added a Foreign Exchange entry to the navigation; on the live site it existed nowhere a visitor could click to.',
      },
      {
        id: 'outcome',
        heading: 'Outcome',
        body: 'Outcome not yet measured. This is a redesign concept, not the bureau\'s live site.',
      },
      {
        id: 'what-i-took-from-it',
        heading: 'What I took from it',
        body:
          'A live clock over a stale number is a small bug that costs real trust. Fixing what a number claims about itself mattered more than any animation on the page.',
      },
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'GSAP', 'D3.js'],
    video: '/case-studies/kamwe-forex/walkthrough.mp4',
    poster: '/case-studies/kamwe-forex/poster.webp',
    live: 'https://kamwe-forex.vercel.app',
    repo: 'https://github.com/TheyloveShaka/kamwe-forex',
  },
]
