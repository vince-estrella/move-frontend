// Talks to the MOVE backend (move-backend). Venues and games come from the server and are
// copied into the local tables, so pages keep reading them with useTable() like before.
// Everything the backend has no endpoint for yet (friends, chat, tourneys, reviews...) stays local.
import { db, getSession, setSession } from './db';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'move_db_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => (token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. Is move-backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    // token expired or the server's JWT_SECRET changed: log out
    setToken(null);
    setSession(null);
  }
  if (!res.ok) throw new Error(data.message ?? `Server error (${res.status})`);
  return data;
}

// ---- server rows -> the shapes the pages already use ----
const sportKey = (activityType) => activityType?.name.toLowerCase() ?? 'other';
const pad = (n) => String(n).padStart(2, '0');
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// The backend has no skill level column yet, so it rides in the description.
const LEVEL_PREFIX = 'Skill level: ';
const levelOf = (description) => (description?.startsWith(LEVEL_PREFIX) ? description.slice(LEVEL_PREFIX.length).split('\n')[0] : 'Any');

function toVenue(location, activities) {
  const details = location.facilityDetails;
  const sports = [...new Set(activities.filter((a) => a.locationId === location.id).map((a) => sportKey(a.activityType)))];
  return {
    id: location.id,
    name: location.name,
    area: location.address,
    description: location.description,
    lat: Number(location.latitude),
    lng: Number(location.longitude),
    type: location.type,
    sports,
    price: Number(details?.rates?.replace(/[^\d.]/g, '')) || 0,
    courts: null, // not in the backend yet
    amenities: details?.amenities ? details.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [],
    bookingUrl: details?.bookingUrl ?? null,
    contact: details?.contactInfo ?? null,
  };
}

function toMatch(activity) {
  const start = new Date(activity.startTime);
  const people = activity.participants ?? [];
  const named = (status) => people.filter((p) => p.status === status).map((p) => p.user.name);
  return {
    id: activity.id,
    title: activity.title,
    sport: sportKey(activity.activityType),
    venueId: activity.locationId,
    date: localDate(start),
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    level: levelOf(activity.description),
    spots: activity.maxParticipants ? activity.maxParticipants + 1 : 0, // + the host
    host: activity.organizer.name,
    hostId: activity.organizerId,
    joined: [activity.organizer.name, ...named('ACCEPTED')],
    pending: named('PENDING'),
    status: activity.status,
  };
}

const replaceTable = (name, rows) => {
  localStorage.setItem(`move_db_${name}`, JSON.stringify(rows));
  window.dispatchEvent(new Event('move-db-change'));
};

// Pull venues and games from the server into the local tables.
export async function syncFromApi() {
  const [locations, activities] = await Promise.all([api('/locations'), api('/activities')]);
  replaceTable('venues', locations.map((l) => toVenue(l, activities)));
  replaceTable('matches', activities.filter((a) => !['CANCELLED', 'REJECTED'].includes(a.status)).map(toMatch));
}

let activityTypes = null;
async function activityTypeId(sport) {
  activityTypes ??= await api('/activity-types');
  const type = activityTypes.find((t) => t.name.toLowerCase() === sport);
  if (!type) throw new Error(`The server doesn't know the sport "${sport}" yet.`);
  return type.id;
}

export async function hostGame({ title, sport, venueId, date, time, level, spots }) {
  const start = new Date(`${date}T${time}`);
  await api('/activities', {
    method: 'POST',
    body: {
      activityTypeId: await activityTypeId(sport),
      locationId: venueId,
      title,
      description: `${LEVEL_PREFIX}${level}`,
      date: start.toISOString(),
      startTime: start.toISOString(),
      maxParticipants: Number(spots) - 1, // the host is one of the players
    },
  });
  await syncFromApi();
}

export async function requestToJoin(matchId) {
  await api(`/activity-participants/${matchId}/join`, { method: 'POST' });
  await syncFromApi();
}

// ---- accounts ----
// The server owns the account. A local row with the same id keeps the app-only extras
// (avatar, sport, level, achievements) that the backend doesn't store yet.
function startSession(user, token) {
  setToken(token);
  const local = db.users.get(user.id);
  if (local) db.users.update(user.id, { name: user.name, email: user.email, bio: user.bio });
  else {
    const rows = db.users.all();
    localStorage.setItem('move_db_users', JSON.stringify([...rows, { ...user, createdAt: new Date().toISOString() }]));
  }
  setSession(user.id);
}

export async function apiLogin({ email, password }) {
  const { token, user } = await api('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
  startSession(user, token);
}

export async function apiSignup({ name, email, password }) {
  await api('/auth/register', { method: 'POST', body: { name: name.trim() || 'Player One', email: email.trim().toLowerCase(), password } });
  await apiLogin({ email, password });
}

// A session left over from the old browser-only accounts has no token: drop it.
export function dropStaleSession() {
  if (getSession() && !getToken()) setSession(null);
}
