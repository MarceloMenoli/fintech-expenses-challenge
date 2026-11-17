import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, errorMessage } from '../api';
import type { Page, Transaction } from '../types';
import { Empty, Feedback, Loading } from '../components/Feedback';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionFilters, emptyFilters } from '../components/TransactionFilters';
import { Pagination } from '../components/Pagination';
import { ConfirmDelete } from '../components/ConfirmDelete';

export function TransactionsPage() {
  const client = useQueryClient();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [message, setMessage] = useState('');
  const query = useQuery({
    queryKey: ['transactions', filters, page],
    queryFn: async () => {
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
        page,
        limit: 10,
      };
      return (await api.get<Page<Transaction>>('/transactions', { params })).data;
    },
  });
  const mutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: async () => {
      if (query.data?.data.length === 1 && page > 1) setPage(page - 1);
      await client.invalidateQueries();
      setDeleting(null);
      setMessage('Transação excluída.');
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU HISTÓRICO, EM DETALHES</span>
          <h1>Transações</h1>
          <p>Acompanhe cada entrada e saída do seu dinheiro.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setMessage('');
            setEditing('new');
          }}
        >
          <Plus size={17} />
          Nova transação
        </button>
      </div>
      <Feedback message={message} success />
      <TransactionFilters
        onApply={(filters) => {
          setFilters(filters);
          setPage(1);
        }}
      />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Suas movimentações</h2>
            <p>
              {query.data
                ? `${query.data.meta.total} transações encontradas`
                : 'Entradas e saídas organizadas por data'}
            </p>
          </div>
          <span className="subtle-tag">Mais recentes primeiro</span>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <div className="panel-error">
            <Feedback message={errorMessage(query.error)} />
            <button className="button" onClick={() => void query.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {!query.data.data.length ? (
              <Empty
                title="Nenhuma movimentação por aqui"
                detail="Registre uma transação ou ajuste os filtros para encontrar o que procura."
              />
            ) : (
              <TransactionTable
                rows={query.data.data}
                onEdit={setEditing}
                onDelete={(row) => {
                  mutation.reset();
                  setDeleting(row);
                }}
              />
            )}
            <Pagination {...query.data.meta} onChange={setPage} />
          </>
        )}
      </section>
      {editing && (
        <TransactionForm
          transaction={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage('Transação salva com sucesso.');
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.description}
          busy={mutation.isPending}
          error={mutation.isError ? errorMessage(mutation.error) : ''}
          onClose={() => setDeleting(null)}
          onConfirm={() => mutation.mutate(deleting.id)}
        />
      )}
    </>
  );
}
