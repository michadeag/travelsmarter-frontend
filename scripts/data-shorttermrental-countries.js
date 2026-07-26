// Mirrors server/controllers/shortTermRentalController.js's COUNTRIES
// object exactly (kept in sync manually — see other data-*.js files for
// the same pattern).
module.exports = [
  { slug: 'spain', name: 'Spain', level: 'heavy', note: 'Barcelona has moved to phase out most short-term tourist apartment licenses entirely by 2028, and several other Spanish cities have tightened registration rules — always verify the listing has a valid license number displayed.' },
  { slug: 'united-states', name: 'United States', level: 'heavy', note: 'Regulation is set city-by-city, not nationally — New York City in particular has very strict registration rules that have sharply reduced listings, while many other US cities remain far more permissive.' },
  { slug: 'france', name: 'France', level: 'heavy', note: 'Paris requires registration and caps most rentals at 120 nights per year for a primary residence — several other French cities have adopted similar rules.' },
  { slug: 'netherlands', name: 'Netherlands', level: 'heavy', note: 'Amsterdam caps short-term rentals at 30 nights per year and requires registration, with permits limited in some neighborhoods.' },
  { slug: 'japan', name: 'Japan', level: 'heavy', note: 'The Minpaku law requires official registration and caps most private rentals at 180 days per year — unregistered listings are illegal to book, though enforcement of individual listings can be hard for guests to verify.' },
  { slug: 'singapore', name: 'Singapore', level: 'heavy', note: 'Short-term rentals of private residential property under 3 months are effectively illegal — this is one of the strictest markets in the world for this.' },
  { slug: 'greece', name: 'Greece', level: 'heavy', note: 'Athens and several popular islands have paused new short-term rental licenses in central/high-density areas to control oversupply.' },

  { slug: 'italy', name: 'Italy', level: 'moderate', note: 'A national identification code (CIN) is now required for most short-term rental listings, with additional city-level rules (Venice, Florence, Milan) layered on top.' },
  { slug: 'germany', name: 'Germany', level: 'moderate', note: 'Berlin requires registration and limits whole-apartment rentals without a permit — other German cities have their own, generally less strict, rules.' },
  { slug: 'portugal', name: 'Portugal', level: 'moderate', note: 'Lisbon has suspended new "Alojamento Local" licenses in several central districts, though existing licensed listings continue operating.' },
  { slug: 'united-kingdom', name: 'United Kingdom', level: 'moderate', note: 'London caps short-term whole-home rentals at 90 nights per year without special planning permission.' },
  { slug: 'australia', name: 'Australia', level: 'moderate', note: 'Regulation varies significantly by state and city — Sydney and parts of NSW have registration requirements, while other regions remain more permissive.' },
  { slug: 'new-zealand', name: 'New Zealand', level: 'moderate', note: 'Regulation varies by council — Queenstown and Auckland have introduced stricter rules than smaller towns.' },
  { slug: 'canada', name: 'Canada', level: 'moderate', note: "Toronto and Vancouver require registration and restrict rentals to a host's primary residence in many cases — rules vary significantly by province and city." },
  { slug: 'croatia', name: 'Croatia', level: 'moderate', note: 'National registration is required, though enforcement and specific caps vary by municipality.' },
  { slug: 'thailand', name: 'Thailand', level: 'moderate', note: 'Short-term rentals technically fall under hotel licensing law in many areas, creating a legal gray zone — enforcement varies significantly by location.' },
  { slug: 'mexico', name: 'Mexico', level: 'moderate', note: 'Mexico City has introduced registration requirements and a night-cap for short-term rentals given rapid growth in the market.' },
  { slug: 'austria', name: 'Austria', level: 'moderate', note: 'Vienna and other cities have registration and zoning requirements that vary by district.' },
  { slug: 'switzerland', name: 'Switzerland', level: 'moderate', note: 'Regulation varies by canton and municipality — some resort towns have tighter caps than major cities.' },

  { slug: 'vietnam', name: 'Vietnam', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific regulation, though this is evolving as the market grows.' },
  { slug: 'indonesia', name: 'Indonesia', level: 'light', note: 'Bali has discussed tighter regulation given rapid growth, but enforcement remains inconsistent as of writing — broadly permissive in practice.' },
  { slug: 'philippines', name: 'Philippines', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'malaysia', name: 'Malaysia', level: 'light', note: 'Regulation is limited and inconsistently enforced — broadly permissive in practice, though some condominium buildings set their own rules.' },
  { slug: 'india', name: 'India', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'south-korea', name: 'South Korea', level: 'moderate', note: 'Short-term rental hosting is technically restricted to licensed properties or foreigner-designated zones in many areas — check listing legitimacy carefully.' },
  { slug: 'china', name: 'China', level: 'moderate', note: 'Short-term rental platforms operate but require host registration with local authorities in most cities.' },

  { slug: 'turkey', name: 'Turkey', level: 'moderate', note: 'Short-term rentals now require a permit under national rules introduced in recent years — unlicensed listings can face fines.' },
  { slug: 'israel', name: 'Israel', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'united-arab-emirates', name: 'United Arab Emirates', level: 'moderate', note: 'Dubai requires hosts to obtain a permit through Dubai Tourism (DET) — unlicensed listings are technically illegal.' },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation as the tourism sector expands.' },
  { slug: 'egypt', name: 'Egypt', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'morocco', name: 'Morocco', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation, though some riads/guesthouses require separate tourism licenses.' },
  { slug: 'jordan', name: 'Jordan', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },

  { slug: 'brazil', name: 'Brazil', level: 'light', note: 'Short-term rentals are broadly permitted nationally, though some individual condominium buildings restrict them via their own bylaws.' },
  { slug: 'argentina', name: 'Argentina', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'chile', name: 'Chile', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'colombia', name: 'Colombia', level: 'moderate', note: 'Registration with the national tourism registry (RNT) is required for short-term rental hosts.' },
  { slug: 'peru', name: 'Peru', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'costa-rica', name: 'Costa Rica', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },

  { slug: 'poland', name: 'Poland', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'norway', name: 'Norway', level: 'light', note: 'Short-term rentals of a primary residence are broadly permitted, with only modest limits on rental income.' },
  { slug: 'sweden', name: 'Sweden', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'denmark', name: 'Denmark', level: 'moderate', note: 'A national cap limits short-term rental of a primary residence to around 70-100 days per year without registering as a business.' },
  { slug: 'iceland', name: 'Iceland', level: 'moderate', note: 'Hosts must register and are capped at 90 days per year (or a set income threshold) before requiring a full operating license.' },
  { slug: 'ireland', name: 'Ireland', level: 'heavy', note: 'Short-term letting in "Rent Pressure Zones" (most cities) requires planning permission for anything beyond renting a room in your own home — enforcement has increased significantly.' },
  { slug: 'czech-republic', name: 'Czech Republic', level: 'light', note: 'Prague has discussed tighter rules given tourism volume, but regulation remains relatively light in practice as of writing.' },

  { slug: 'south-africa', name: 'South Africa', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
  { slug: 'kenya', name: 'Kenya', level: 'light', note: 'Short-term rentals are broadly permitted with minimal specific national regulation.' },
];
