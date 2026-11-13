import { useState } from 'react';
import { IoChatbubbles, IoCheckmarkCircle } from 'react-icons/io5';
import { useTable, useProfile, getSettings } from '../data/db';
import { requestToJoin } from '../data/api';
import GameReminder from '../components/GameReminder';
import { setGameReminder } from '../data/reminders';
import { usePlays, logPlay, todayISO, addDays } from '../data/plays';
import { Page, Card, Btn, SportChips, Empty, FriendsJoining, fmtDate, fmtTime, sportOf, SportIcon } from '../components/ui';

export default function OpenPlay() {
  const matches = useTable('matches');
  const venues = useTable('venues');
  const me = useProfile().name;
  const plays = usePlays();
  const [sport, setSport] = useState('all');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState({});

  const list = matches
    .filter((m) => sport === 'all' || m.sport === sport)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  // the host accepts or declines the request on the server; there is no "leave" endpoint yet
  const join = async (m) => {
    setBusy(m.id);
    setError({});
    try {
      await requestToJoin(m.id);
      if (getSettings().notifyGames !== false) setGameReminder(m, 60); // default: 1 hour before
    } catch (err) {
      setError({ [m.id]: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page
      title="Open play"
      subtitle="Join a game or host your own"
      back={false}
      actions={<Btn to="/host">Host play</Btn>}
    >
      <SportChips value={sport} onChange={setSport} />
      {list.length === 0 ? (
        <Empty title="No games yet" hint="Be the first to host one." action={<Btn to="/host">Host play</Btn>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((m) => {
            const venue = venues.find((v) => v.id === m.venueId);
            const isIn = m.joined.includes(me);
            const requested = m.pending?.includes(me);
            const open = m.status === 'CONFIRMED';
            const left = m.spots - m.joined.length;
            return (
              <Card key={m.id}>
                <p className="text-xs font-bold text-[#006948]"><SportIcon sport={m.sport} /> {sportOf(m.sport).label} · {m.level}</p>
                <h3 className="mt-1 text-lg font-bold">{m.title}</h3>
                <p className="text-sm text-[#565e74]">
                  {fmtDate(m.date)}, {fmtTime(m.time)} · {venue?.name ?? 'Venue TBA'}
                </p>
                <p className="mt-1 text-sm">Hosted by {m.host} · {left > 0 ? `${left} spots left` : 'Full'}</p>
                <FriendsJoining names={m.joined} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {isIn ? (
                    <span className="inline-flex items-center gap-1.5 px-2 text-sm font-bold text-[#006948]"><IoCheckmarkCircle size={18} /> {m.host === me ? 'Your game' : "You're in"}</span>
                  ) : requested ? (
                    <Btn variant="soft" disabled>Request sent</Btn>
                  ) : !open ? (
                    <Btn variant="soft" disabled>Waiting for court booking</Btn>
                  ) : (
                    <Btn disabled={left <= 0 || busy === m.id} onClick={() => join(m)}>{busy === m.id ? 'Sending…' : 'Ask to join'}</Btn>
                  )}
                  {isIn && <Btn to={`/chat/room/${m.id}`} variant="soft"><IoChatbubbles size={16} /> Game chat</Btn>}
                  {isIn && plays.some((p) => p.matchId === m.id) && <span className="inline-flex items-center gap-1.5 px-2 text-sm font-bold text-[#006948]"><IoCheckmarkCircle size={18} /> Checked in</span>}
                  {isIn && !plays.some((p) => p.matchId === m.id) && m.date <= todayISO() && m.date >= addDays(todayISO(), -14) && (
                    <Btn onClick={() => logPlay({ sport: m.sport, date: m.date, matchId: m.id })}>Check in</Btn>
                  )}
                </div>
                {error[m.id] && <p role="alert" className="mt-2 text-sm font-semibold text-[#ba1a1a]">{error[m.id]}</p>}
                {isIn && <GameReminder match={m} />}
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
