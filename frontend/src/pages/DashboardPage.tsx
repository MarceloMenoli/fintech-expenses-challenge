import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { monthPeriod } from '../format';
import type { Envelope, Page, Summary, Transaction } from '../types';
import { Empty, Feedback, Loading } from '../components/Feedback';
import { SummaryCards } from '../components/SummaryCards';
import { CategoryRanking } from '../components/CategoryRanking';
import { PeriodFilter } from '../components/PeriodFilter';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(monthPeriod);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const summary = useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () =>
      (await api.get<Envelope<Summary>>('/dashboard', { params: period })).data.data,
  });
  const recent = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async () =>
      (await api.get<Page<Transaction>>('/transactions', { params: { limit: 5 } })).data,
  });
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">UM OLHAR PARA SUAS FINANÇAS</span>
          <h1>
            Olá, {user?.name.split(' ')[0]} <span className="greeting-dot">✦</span>
          </h1>
          <p>Veja como está seu dinheiro e planeje seus próximos passos.</p>
        </div>
        <PeriodFilter initial={period} onApply={setPeriod} />
      </div>
      <Feedback message={message} success />
      {summary.isPending ? (
        <Loading />
      ) : summary.isError ? (
        <div className="panel-error">
          <Feedback message={errorMessage(summary.error)} />
          <button className="button" onClick={() => void summary.refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <SummaryCards summary={summary.data} />
          <div className="dashboard-middle">
            <CategoryRanking categories={summary.data.topCategories} />
          </div>
        </>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Últimas movimentações</h2>
            <p>Seus registros mais recentes, em qualquer período</p>
          </div>
          <div className="heading-actions">
            <Link to="/transactions" className="panel-link">
              Ver todas <ArrowRight size={14} />
            </Link>
            <button
              className="button primary small"
              onClick={() => {
                setMessage('');
                setCreating(true);
              }}
            >
              <Plus size={15} />
              Nova transação
            </button>
          </div>
        </div>
        {recent.isPending ? (
          <Loading />
        ) : recent.isError ? (
          <div className="panel-error">
            <Feedback message={errorMessage(recent.error)} />
            <button className="button" onClick={() => void recent.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : !recent.data.data.length ? (
          <Empty
            title="Sua história começa aqui"
            detail="Adicione sua primeira transação para acompanhar suas finanças."
          />
        ) : (
          <TransactionTable rows={recent.data.data} />
        )}
      </section>
      {creating && (
        <TransactionForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setMessage('Transação registrada. Seus indicadores foram atualizados.');
          }}
        />
      )}
    </>
  );
}
