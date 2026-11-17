import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import type { Category } from '../types';
import { Feedback } from './Feedback';
import { Modal } from './Modal';

export function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string | null }) =>
      category ? api.patch(`/categories/${category.id}`, data) : api.post('/categories', data),
    onSuccess: async () => {
      await client.invalidateQueries();
      onSaved();
    },
    onError: (error) => setError(errorMessage(error)),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim() || null,
    });
  }
  return (
    <Modal
      title={category ? 'Editar categoria' : 'Nova categoria'}
      busy={mutation.isPending}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        <Feedback message={error} />
        <label>
          Nome
          <input
            name="name"
            placeholder="Ex.: Software e ferramentas"
            maxLength={100}
            required
            defaultValue={category?.name}
          />
        </label>
        <label>
          Descrição <span className="hint">Opcional</span>
          <textarea
            name="description"
            placeholder="O que faz parte desta categoria?"
            maxLength={500}
            defaultValue={category?.description ?? ''}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Salvar categoria'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
