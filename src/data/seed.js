// Starter data for the local database. Venues and games are NOT seeded here: they come from
// the MOVE backend (see api.js).
// Edit freely, then bump DB_VERSION in db.js to re-seed.
export const SPORTS = [
  { key: 'pickleball', label: 'Pickleball', emoji: '🏓' },
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'badminton', label: 'Badminton', emoji: '🏸' },
  { key: 'tennis', label: 'Tennis', emoji: '🎾' },
  { key: 'padel', label: 'Padel', emoji: '🥎' },
];

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const seed = {
  venues: [],
  matches: [],
  players: [
    { id: 'p1', name: 'Migs Alcantara', sport: 'pickleball', level: 'Intermediate', area: 'Minglanilla', invited: false },
    { id: 'p2', name: 'Ana Villaluz', sport: 'pickleball', level: 'Beginner', area: 'Talisay', invited: false },
    { id: 'p3', name: 'Rey Dumdum', sport: 'badminton', level: 'Advanced', area: 'Lahug', invited: false },
    { id: 'p4', name: 'Kim Lopez', sport: 'badminton', level: 'Intermediate', area: 'Mandaue', invited: false },
    { id: 'p5', name: 'Paolo Reyes', sport: 'basketball', level: 'Any', area: 'Cebu City', invited: false },
    { id: 'p6', name: 'Lia Tan', sport: 'padel', level: 'Advanced', area: 'Lapu-Lapu', invited: false },
  ],
  tournaments: [
    { id: 't1', name: 'Cebu Weekend Showdown', sport: 'pickleball', venueId: 'minglanilla', date: day(9), fee: 500, slots: 32, registered: ['Migs', 'Ana'] },
    { id: 't2', name: 'Metro Smash Open', sport: 'badminton', venueId: 'lahug', date: day(16), fee: 350, slots: 24, registered: ['Rey', 'Kim'] },
    { id: 't3', name: 'Mactan Padel Cup', sport: 'padel', venueId: 'mactan', date: day(23), fee: 800, slots: 16, registered: ['Lia'] },
  ],
  bookings: [],
};

export const defaultProfile = { name: 'Player One', sport: 'pickleball', level: 'Beginner', area: 'Talisay', isPrivate: false };
