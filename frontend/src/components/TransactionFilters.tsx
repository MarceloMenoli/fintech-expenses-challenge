import { useState, type FormEvent } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useCategories } from '../api';
import { Feedback } from './Feedback';

export interface Filters { type: string; categoryId: string; startDate: string; endDate: string }
export const emptyFilters: Filters = { type: '', categoryId: '', startDate: '', endDate: '' };
export function TransactionFilters({ onApply }: { onApply: (filters: Filters) => void }) {
  const categories = useCategories();
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState('');
  function apply(event: FormEvent) {
    event.preventDefault(); setError('');
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) { setError('Data inicial deve ser anterior ou igual à final.'); return; }
    onApply(filters);
  }
  const field = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return <div className="filter-panel panel"><form className="filters" onSubmit={apply}>
    <label>Tipo<select value={filters.type} onChange={(event) => field('type', event.target.value)}><option value="">Todos os tipos</option><option value="INCOME">Entradas</option><option value="EXPENSE">Saídas</option></select></label>
    <label>Categoria<select value={filters.categoryId} onChange={(event) => field('categoryId', event.target.value)}><option value="">Todas as categorias</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>De<input type="date" value={filters.startDate} onChange={(event) => field('startDate', event.target.value)} /></label><label>Até<input type="date" value={filters.endDate} onChange={(event) => field('endDate', event.target.value)} /></label>
    <button className="button"><SlidersHorizontal size={15} />Filtrar</button><button type="button" className="text-button" onClick={() => { setFilters(emptyFilters); setError(''); onApply(emptyFilters); }}>Limpar</button>
  </form><Feedback message={error || (categories.isError ? 'Não foi possível carregar as categorias dos filtros.' : '')} /></div>;
}
