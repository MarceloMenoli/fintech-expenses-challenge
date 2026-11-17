import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, FolderOpen, Leaf, Plus, Sparkles, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { money, monthPeriod } from '../format';
import type { Envelope, Page, Summary, Transaction } from '../types';
import { Empty, Feedback, Loading } from '../components/Feedback';
import { PeriodFilter } from '../components/PeriodFilter';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(monthPeriod);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const summary = useQuery({ queryKey: ['dashboard', period], queryFn: async () => (await api.get<Envelope<Summary>>('/dashboard', { params: period })).data.data });
  const recent = useQuery({ queryKey: ['transactions', 'recent'], queryFn: async () => (await api.get<Page<Transaction>>('/transactions', { params: { limit: 5 } })).data });
  return <><div className="page-heading dashboard-heading"><div><span className="eyebrow">UM OLHAR PARA SUAS FINANÇAS</span><h1>Olá, {user?.name.split(' ')[0]} <span className="greeting-dot">✦</span></h1><p>Veja como está seu dinheiro e planeje seus próximos passos.</p></div><PeriodFilter initial={period} onApply={setPeriod} /></div>
    <Feedback message={message} success />
    {summary.isPending ? <Loading /> : summary.isError ? <div className="panel-error"><Feedback message={errorMessage(summary.error)} /><button className="button" onClick={() => void summary.refetch()}>Tentar novamente</button></div> : <>
      <div className="summary-grid">
        <article className="summary-card balance"><div className="summary-top">Saldo atual<span className="summary-icon"><Wallet size={18} /></span></div><div className="summary-value">{money(summary.data.balance)}</div><div className="summary-caption"><span className="live-dot" /> Todas as suas movimentações</div></article>
        <article className="summary-card"><div className="summary-top">Entradas no período<span className="summary-icon"><ArrowDownLeft size={18} /></span></div><div className="summary-value">{money(summary.data.income)}</div><div className="summary-caption">Receitas no período selecionado</div></article>
        <article className="summary-card"><div className="summary-top">Saídas no período<span className="summary-icon"><ArrowUpRight size={18} /></span></div><div className="summary-value">{money(summary.data.expense)}</div><div className="summary-caption">Despesas no período selecionado</div></article>
      </div>
      <div className="dashboard-middle"><section className="panel"><div className="panel-heading"><div><h2>Para onde vai seu dinheiro</h2><p>As 3 maiores categorias de saída no período</p></div><FolderOpen size={17} color="#a0ad91" /></div>
        {summary.data.topCategories.length ? <div className="category-ranking">{summary.data.topCategories.map((category, index) => <div className="rank-row" key={category.id}><span className="rank-number">0{index + 1}</span><span className={`category-icon tone-${index}`}><FolderOpen size={16} /></span><span className="rank-name">{category.name}</span><strong>{money(category.amount)}</strong></div>)}</div> : <Empty title="Um novo começo" detail="Suas principais categorias aparecerão aqui quando você registrar saídas neste período." />}
      </section><section className="insight-panel"><div><span className="insight-icon"><Sparkles size={15} /> UM PASSO DE CADA VEZ</span><h2>Pequenos registros.<br />Grandes decisões.</h2><p>Manter suas movimentações em dia é o primeiro passo para uma vida financeira mais organizada.</p></div><Link to="/categories">Organizar minhas categorias <ArrowRight size={15} /></Link><Leaf className="insight-decoration" size={83} strokeWidth={1} /></section></div>
    </>}
    <section className="panel"><div className="panel-heading"><div><h2>Últimas movimentações</h2><p>Seus registros mais recentes, em qualquer período</p></div><div className="heading-actions"><Link to="/transactions" className="panel-link">Ver todas <ArrowRight size={14} /></Link><button className="button primary small" onClick={() => { setMessage(''); setCreating(true); }}><Plus size={15} />Nova transação</button></div></div>
      {recent.isPending ? <Loading /> : recent.isError ? <div className="panel-error"><Feedback message={errorMessage(recent.error)} /><button className="button" onClick={() => void recent.refetch()}>Tentar novamente</button></div> : !recent.data.data.length ? <Empty title="Sua história começa aqui" detail="Adicione sua primeira transação para acompanhar suas finanças." /> : <TransactionTable rows={recent.data.data} />}
    </section>
    {creating && <TransactionForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setMessage('Transação registrada. Seus indicadores foram atualizados.'); }} />}
  </>;
}
