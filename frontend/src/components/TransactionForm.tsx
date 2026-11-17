import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, errorMessage, useCategories } from '../api';
import { parseCents, today } from '../format';
import type { Transaction, TransactionInput, TransactionType } from '../types';
import { Feedback, Loading } from './Feedback';
import { Modal } from './Modal';

export function TransactionForm({ transaction, onClose, onSaved }: { transaction?: Transaction; onClose: () => void; onSaved: () => void }) {
  const categories = useCategories();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (data: TransactionInput) => transaction ? api.patch(`/transactions/${transaction.id}`, data) : api.post('/transactions', data),
    onSuccess: async () => { await client.invalidateQueries(); onSaved(); },
    onError: (error) => setError(errorMessage(error)),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      mutation.mutate({ description: String(form.get('description')).trim(), amount: parseCents(String(form.get('amount'))),
        type: String(form.get('type')) as TransactionType, date: String(form.get('date')), categoryId: String(form.get('categoryId')) });
    } catch (error) { setError(errorMessage(error)); }
  }
  return <Modal title={transaction ? 'Editar transação' : 'Nova transação'} onClose={onClose} busy={mutation.isPending}>
    {categories.isPending ? <Loading /> : categories.isError ? <><Feedback message={errorMessage(categories.error)} /><button className="button" onClick={() => void categories.refetch()}>Tentar novamente</button></> : !categories.data.length ? <div><p>Crie uma categoria antes de registrar sua primeira transação.</p><Link className="button primary" to="/categories">Criar categoria</Link></div> : <form className="form-stack" onSubmit={submit}><Feedback message={error} />
      <label>Descrição<input name="description" placeholder="Ex.: Assinatura de software" required maxLength={200} defaultValue={transaction?.description} /></label>
      <div className="form-row"><label>Tipo<select name="type" defaultValue={transaction?.type ?? 'EXPENSE'}><option value="EXPENSE">Saída</option><option value="INCOME">Entrada</option></select></label><label>Valor (R$)<input name="amount" inputMode="decimal" placeholder="0,00" required defaultValue={transaction ? (transaction.amount / 100).toFixed(2).replace('.', ',') : ''} /><span className="hint">Use vírgula ou ponto, sem separador de milhar.</span></label></div>
      <div className="form-row"><label>Data<input name="date" type="date" required defaultValue={transaction?.date ?? today()} /></label><label>Categoria<select name="categoryId" required defaultValue={transaction?.categoryId ?? ''}><option value="" disabled>Selecione</option>{categories.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
      <div className="form-actions"><button type="button" className="button" onClick={onClose} disabled={mutation.isPending}>Cancelar</button><button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar transação'}</button></div>
    </form>}
  </Modal>;
}
