import { useState, type FormEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { Feedback } from './Feedback';

export interface Period { startDate: string; endDate: string }
export function PeriodFilter({ initial, onApply }: { initial: Period; onApply: (period: Period) => void }) {
  const [period, setPeriod] = useState(initial);
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (period.startDate > period.endDate) { setError('Data inicial deve ser anterior ou igual à final.'); return; }
    setError(''); onApply(period);
  }
  return <div><form className="period-form" onSubmit={submit}><label>De<input type="date" value={period.startDate} required onChange={(event) => setPeriod({ ...period, startDate: event.target.value })} /></label><label>Até<input type="date" value={period.endDate} required onChange={(event) => setPeriod({ ...period, endDate: event.target.value })} /></label><button className="button" aria-label="Aplicar período"><CalendarDays size={15} />Aplicar</button></form><Feedback message={error} /></div>;
}
