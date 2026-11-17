import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { money } from '../format';
import type { Summary } from '../types';

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    {
      title: 'Saldo atual',
      value: summary.balance,
      icon: Wallet,
      balance: true,
      caption: 'Todas as suas movimentações',
    },
    {
      title: 'Entradas no período',
      value: summary.income,
      icon: ArrowDownLeft,
      balance: false,
      caption: 'Receitas no período selecionado',
    },
    {
      title: 'Saídas no período',
      value: summary.expense,
      icon: ArrowUpRight,
      balance: false,
      caption: 'Despesas no período selecionado',
    },
  ];
  return (
    <div className="summary-grid">
      {cards.map(({ title, value, icon: Icon, balance, caption }) => (
        <article key={title} className={`summary-card${balance ? ' balance' : ''}`}>
          <div className="summary-top">
            {title}
            <span className="summary-icon">
              <Icon size={18} />
            </span>
          </div>
          <div className="summary-value">{money(value)}</div>
          <div className="summary-caption">
            {balance && <span className="live-dot" />}
            {caption}
          </div>
        </article>
      ))}
    </div>
  );
}
