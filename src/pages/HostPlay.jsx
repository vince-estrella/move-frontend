import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTable } from '../data/db';
import { hostGame } from '../data/api';
import { SPORTS } from '../data/seed';
import { Page, Card, Btn, Field, inputCls } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);

export default function HostPlay() {
  const navigate = useNavigate();
  const venues = useTable('venues');
  const [form, setForm] = useState({ title: '', sport: 'pickleball', venueId: '', date: today(), time: '17:00', level: 'Any', spots: 8 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await hostGame({ ...form, venueId: form.venueId || venues[0]?.id });
      navigate('/open-play');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Host play" subtitle="Set up an open game for other players">
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Game title">
              <input required className={inputCls} value={form.title} onChange={set('title')} placeholder="Saturday morning doubles" />
            </Field>
          </div>
          <Field label="Sport">
            <select className={inputCls} value={form.sport} onChange={set('sport')}>
              {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Venue">
            <select className={inputCls} value={form.venueId || venues[0]?.id || ''} onChange={set('venueId')}>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" min={today()} required className={inputCls} value={form.date} onChange={set('date')} /></Field>
          <Field label="Start time"><input type="time" required className={inputCls} value={form.time} onChange={set('time')} /></Field>
          <Field label="Skill level">
            <select className={inputCls} value={form.level} onChange={set('level')}>
              {['Any', 'Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Players needed">
            <input type="number" min="2" max="30" className={inputCls} value={form.spots} onChange={set('spots')} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-[#ba1a1a] md:col-span-2">{error}</p>}
          <div className="md:col-span-2"><Btn type="submit" disabled={busy || !venues.length}>{busy ? 'Posting…' : 'Post game'}</Btn></div>
        </form>
      </Card>
    </Page>
  );
}
