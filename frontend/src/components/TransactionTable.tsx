import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { civilDate, money } from '../format';
import type { Transaction } from '../types';

export function TransactionTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: Transaction[];
  onEdit?: (row: Transaction) => void;
  onDelete?: (row: Transaction) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>DESCRIÇÃO</th>
            <th>CATEGORIA</th>
            <th>DATA</th>
            <th className="align-right">VALOR</th>
            {onEdit && <th className="align-right">AÇÕES</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="transaction-description">
                  <span
                    className={`transaction-symbol ${row.type === 'INCOME' ? 'income' : 'expense'}`}
                  >
                    {row.type === 'INCOME' ? (
                      <ArrowDownLeft size={17} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </span>
                  <div>
                    <strong>{row.description}</strong>
                    <small>{row.type === 'INCOME' ? 'Entrada' : 'Saída'}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="category-badge">{row.category.name}</span>
              </td>
              <td className="date-cell">{civilDate(row.date)}</td>
              <td className={`amount align-right ${row.type === 'INCOME' ? 'positive' : ''}`}>
                {row.type === 'INCOME' ? '+' : '−'} {money(row.amount)}
              </td>
              {onEdit && (
                <td className="align-right actions-cell">
                  <button
                    className="icon-button"
                    aria-label={`Editar ${row.description}`}
                    onClick={() => onEdit(row)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Excluir ${row.description}`}
                    onClick={() => onDelete?.(row)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
