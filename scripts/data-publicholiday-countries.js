// Mirrors server/controllers/publicHolidayController.js's COUNTRIES object
// exactly (kept in sync manually — see other data-*.js files for the same
// pattern). type:'fixed' holidays are matched exactly against trip dates;
// type:'variable' ones (lunar/Easter-based) are flagged as "possible".
const NEW_YEAR = { name: "New Year's Day", type: 'fixed', month: 1, day: 1 };
const LABOUR_DAY = { name: 'Labour Day', type: 'fixed', month: 5, day: 1 };
const CHRISTMAS = { name: 'Christmas Day', type: 'fixed', month: 12, day: 25 };
const EASTER = { name: 'Easter / Good Friday', type: 'variable', months: [3, 4], note: 'Date shifts every year, typically falling in March or April.' };
const LUNAR_NEW_YEAR = { name: 'Lunar New Year', type: 'variable', months: [1, 2], note: 'Date shifts every year based on the lunar calendar, typically late January or February.' };
const EID_FITR = { name: 'Eid al-Fitr', type: 'variable', months: [2, 3, 4], note: "Shifts about 11 days earlier each Gregorian year — check the exact date for your travel year." };
const EID_ADHA = { name: 'Eid al-Adha', type: 'variable', months: [4, 5, 6], note: "Shifts about 11 days earlier each Gregorian year — check the exact date for your travel year." };
const DIWALI = { name: 'Diwali', type: 'variable', months: [10, 11], note: 'Date shifts every year based on the lunar calendar, typically October or November.' };
const THANKSGIVING = { name: 'Thanksgiving', type: 'variable', months: [11], note: 'Always the 4th Thursday of November — many businesses close, and travel volume spikes around it.' };
const GOLDEN_WEEK = { name: 'Golden Week', type: 'variable', months: [4, 5], note: 'A cluster of national holidays in late April/early May — expect widespread closures and heavy domestic travel.' };
const CHUSEOK = { name: 'Chuseok', type: 'variable', months: [9, 10], note: 'Korean harvest festival, date shifts every year based on the lunar calendar, typically September or October.' };

module.exports = [
  { slug: 'thailand', name: 'Thailand', holidays: [NEW_YEAR, { name: 'Songkran (Thai New Year)', type: 'fixed', month: 4, day: 13 }, { name: "King's Birthday", type: 'fixed', month: 7, day: 28 }, { name: 'Chulalongkorn Day', type: 'fixed', month: 10, day: 23 }] },
  { slug: 'indonesia', name: 'Indonesia', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 8, day: 17 }, EID_FITR] },
  { slug: 'vietnam', name: 'Vietnam', holidays: [NEW_YEAR, { name: 'Reunification Day', type: 'fixed', month: 4, day: 30 }, { name: 'National Day', type: 'fixed', month: 9, day: 2 }, LUNAR_NEW_YEAR] },
  { slug: 'philippines', name: 'Philippines', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 6, day: 12 }, CHRISTMAS, EASTER] },
  { slug: 'malaysia', name: 'Malaysia', holidays: [NEW_YEAR, { name: 'Merdeka Day (National Day)', type: 'fixed', month: 8, day: 31 }, LUNAR_NEW_YEAR, EID_FITR] },
  { slug: 'singapore', name: 'Singapore', holidays: [NEW_YEAR, { name: 'National Day', type: 'fixed', month: 8, day: 9 }, LUNAR_NEW_YEAR, EID_FITR, DIWALI] },
  { slug: 'china', name: 'China', holidays: [NEW_YEAR, { name: 'National Day (Golden Week)', type: 'fixed', month: 10, day: 1 }, LUNAR_NEW_YEAR] },
  { slug: 'india', name: 'India', holidays: [{ name: 'Republic Day', type: 'fixed', month: 1, day: 26 }, { name: 'Independence Day', type: 'fixed', month: 8, day: 15 }, DIWALI] },
  { slug: 'japan', name: 'Japan', holidays: [NEW_YEAR, { name: 'National Foundation Day', type: 'fixed', month: 2, day: 11 }, GOLDEN_WEEK] },
  { slug: 'south-korea', name: 'South Korea', holidays: [{ name: 'Liberation Day', type: 'fixed', month: 8, day: 15 }, { name: 'National Foundation Day', type: 'fixed', month: 10, day: 3 }, LUNAR_NEW_YEAR, CHUSEOK] },

  { slug: 'france', name: 'France', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'Bastille Day', type: 'fixed', month: 7, day: 14 }, CHRISTMAS, EASTER] },
  { slug: 'germany', name: 'Germany', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'German Unity Day', type: 'fixed', month: 10, day: 3 }, CHRISTMAS, EASTER] },
  { slug: 'italy', name: 'Italy', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'Republic Day', type: 'fixed', month: 6, day: 2 }, { name: 'Ferragosto', type: 'fixed', month: 8, day: 15 }, CHRISTMAS, EASTER] },
  { slug: 'spain', name: 'Spain', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'National Day', type: 'fixed', month: 10, day: 12 }, CHRISTMAS, EASTER] },
  { slug: 'netherlands', name: 'Netherlands', holidays: [NEW_YEAR, { name: "King's Day", type: 'fixed', month: 4, day: 27 }, CHRISTMAS, EASTER] },
  { slug: 'portugal', name: 'Portugal', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'Portugal Day', type: 'fixed', month: 6, day: 10 }, { name: 'Restoration of Independence', type: 'fixed', month: 12, day: 1 }, CHRISTMAS, EASTER] },
  { slug: 'greece', name: 'Greece', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 3, day: 25 }, { name: 'Ochi Day', type: 'fixed', month: 10, day: 28 }, CHRISTMAS, EASTER] },
  { slug: 'austria', name: 'Austria', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'National Day', type: 'fixed', month: 10, day: 26 }, CHRISTMAS, EASTER] },
  { slug: 'switzerland', name: 'Switzerland', holidays: [NEW_YEAR, { name: 'Swiss National Day', type: 'fixed', month: 8, day: 1 }, CHRISTMAS, EASTER] },
  { slug: 'ireland', name: 'Ireland', holidays: [NEW_YEAR, { name: "St. Patrick's Day", type: 'fixed', month: 3, day: 17 }, CHRISTMAS, EASTER] },
  { slug: 'poland', name: 'Poland', holidays: [NEW_YEAR, { name: 'Constitution Day', type: 'fixed', month: 5, day: 3 }, { name: 'Independence Day', type: 'fixed', month: 11, day: 11 }, CHRISTMAS, EASTER] },
  { slug: 'sweden', name: 'Sweden', holidays: [NEW_YEAR, { name: 'National Day', type: 'fixed', month: 6, day: 6 }, { name: 'Midsummer', type: 'variable', months: [6], note: 'Always falls on a Friday/Saturday in late June — many businesses close, especially outside major cities.' }, CHRISTMAS] },
  { slug: 'norway', name: 'Norway', holidays: [NEW_YEAR, { name: 'Constitution Day', type: 'fixed', month: 5, day: 17 }, CHRISTMAS, EASTER] },
  { slug: 'czech-republic', name: 'Czech Republic', holidays: [NEW_YEAR, LABOUR_DAY, { name: 'Statehood Day', type: 'fixed', month: 9, day: 28 }, CHRISTMAS, EASTER] },

  { slug: 'united-kingdom', name: 'United Kingdom', holidays: [NEW_YEAR, CHRISTMAS, { name: 'Boxing Day', type: 'fixed', month: 12, day: 26 }, EASTER] },
  { slug: 'united-states', name: 'United States', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 7, day: 4 }, THANKSGIVING, CHRISTMAS] },
  { slug: 'canada', name: 'Canada', holidays: [NEW_YEAR, { name: 'Canada Day', type: 'fixed', month: 7, day: 1 }, { name: 'Thanksgiving (Canada)', type: 'variable', months: [10], note: 'Always the 2nd Monday of October.' }, CHRISTMAS] },
  { slug: 'mexico', name: 'Mexico', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 9, day: 16 }, { name: 'Day of the Dead', type: 'fixed', month: 11, day: 2 }, CHRISTMAS, EASTER] },
  { slug: 'brazil', name: 'Brazil', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 9, day: 7 }, { name: 'Carnival', type: 'variable', months: [2, 3], note: 'Date shifts every year (tied to Easter), typically February or early March — major closures and huge crowds in cities like Rio.' }, CHRISTMAS] },
  { slug: 'argentina', name: 'Argentina', holidays: [NEW_YEAR, { name: 'Revolution Day', type: 'fixed', month: 5, day: 25 }, { name: 'Independence Day', type: 'fixed', month: 7, day: 9 }, CHRISTMAS, EASTER] },
  { slug: 'chile', name: 'Chile', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 9, day: 18 }, CHRISTMAS, EASTER] },
  { slug: 'colombia', name: 'Colombia', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 7, day: 20 }, CHRISTMAS, EASTER] },
  { slug: 'peru', name: 'Peru', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 7, day: 28 }, CHRISTMAS, EASTER] },
  { slug: 'costa-rica', name: 'Costa Rica', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 9, day: 15 }, CHRISTMAS, EASTER] },

  { slug: 'turkey', name: 'Turkey', holidays: [NEW_YEAR, { name: 'Republic Day', type: 'fixed', month: 10, day: 29 }, EID_FITR, EID_ADHA] },
  { slug: 'israel', name: 'Israel', holidays: [{ name: 'Independence Day (Yom HaAtzmaut)', type: 'variable', months: [4, 5], note: 'Follows the Hebrew calendar, typically April or May.' }, { name: 'Rosh Hashanah / Yom Kippur', type: 'variable', months: [9, 10], note: 'Follows the Hebrew calendar, typically September or October — many businesses close for multiple days.' }] },
  { slug: 'united-arab-emirates', name: 'United Arab Emirates', holidays: [NEW_YEAR, { name: 'National Day', type: 'fixed', month: 12, day: 2 }, EID_FITR, EID_ADHA] },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', holidays: [{ name: 'National Day', type: 'fixed', month: 9, day: 23 }, EID_FITR, EID_ADHA] },
  { slug: 'egypt', name: 'Egypt', holidays: [{ name: 'Revolution Day', type: 'fixed', month: 7, day: 23 }, EID_FITR, EID_ADHA] },
  { slug: 'morocco', name: 'Morocco', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 11, day: 18 }, EID_FITR, EID_ADHA] },
  { slug: 'kenya', name: 'Kenya', holidays: [NEW_YEAR, { name: 'Jamhuri Day (Independence)', type: 'fixed', month: 12, day: 12 }, CHRISTMAS, EASTER] },
  { slug: 'nigeria', name: 'Nigeria', holidays: [NEW_YEAR, { name: 'Independence Day', type: 'fixed', month: 10, day: 1 }, CHRISTMAS, EID_FITR] },
  { slug: 'south-africa', name: 'South Africa', holidays: [NEW_YEAR, { name: 'Freedom Day', type: 'fixed', month: 4, day: 27 }, { name: 'Heritage Day', type: 'fixed', month: 9, day: 24 }, CHRISTMAS, EASTER] },

  { slug: 'australia', name: 'Australia', holidays: [NEW_YEAR, { name: 'Australia Day', type: 'fixed', month: 1, day: 26 }, { name: 'ANZAC Day', type: 'fixed', month: 4, day: 25 }, CHRISTMAS, EASTER] },
  { slug: 'new-zealand', name: 'New Zealand', holidays: [NEW_YEAR, { name: 'Waitangi Day', type: 'fixed', month: 2, day: 6 }, { name: 'ANZAC Day', type: 'fixed', month: 4, day: 25 }, CHRISTMAS, EASTER] },
];
