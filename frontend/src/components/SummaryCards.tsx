import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { money } from '../format';
import type { Summary } from '../types';

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    {
      title: 'Entradas no período',
      value: summary.income,
      icon: ArrowDownLeft,
      caption: 'Receitas no período selecionado',
    },
    {
      title: 'Saídas no período',
      value: summary.expense,
      icon: ArrowUpRight,
      caption: 'Despesas no período selecionado',
    },
  ];
  return (
    <div className="balance-overview">
      <article className="balance-hero">
        <span className="balance-label">
          <Wallet size={18} /> Saldo atual
        </span>
        <div className="balance-total">{money(summary.balance)}</div>
        <p>Uma visão completa do que você construiu.</p>
        <span className="balance-scope">
          <span className="live-dot" /> Todas as suas movimentações
        </span>
      </article>
      <section className="period-overview" aria-label="Movimentações no período">
        <span className="eyebrow">SEU PERÍODO EM RESUMO</span>
        {cards.map(({ title, value, icon: Icon, caption }) => (
          <article key={title} className="period-metric">
            <span className="period-metric-icon">
              <Icon size={18} />
            </span>
            <div>
              <div className="summary-top">{title}</div>
              <div className="summary-value">{money(value)}</div>
              <div className="summary-caption">{caption}</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
