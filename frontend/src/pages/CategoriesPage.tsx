import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage, useCategories } from '../api';
import type { Category } from '../types';
import { Feedback, Loading, Empty } from '../components/Feedback';
import { CategoryForm } from '../components/CategoryForm';
import { ConfirmDelete } from '../components/ConfirmDelete';

export function CategoriesPage() {
  const query = useCategories();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  const mutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: async () => {
      await client.invalidateQueries();
      setDeleting(null);
      setMessage('Categoria excluída.');
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA COISA NO SEU LUGAR</span>
          <h1>Categorias</h1>
          <p>Organize suas movimentações do seu jeito.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setMessage('');
            setEditing('new');
          }}
        >
          <Plus size={17} />
          Nova categoria
        </button>
      </div>
      <Feedback message={message} success />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <>
          <Feedback message={errorMessage(query.error)} />
          <button className="button" onClick={() => void query.refetch()}>
            Tentar novamente
          </button>
        </>
      ) : (
        <>
          <div className="section-line">
            <span>
              {query.data.length}{' '}
              {query.data.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
            </span>
            <span>Disponíveis para entradas e saídas</span>
          </div>
          {query.data.length === 0 ? (
            <div className="panel">
              <Empty
                title="Tudo começa com uma categoria"
                detail="Crie sua primeira categoria para organizar receitas e despesas."
              />
            </div>
          ) : (
            <div className="category-grid">
              {query.data.map((category, index) => (
                <article key={category.id} className="panel category-card">
                  <div className="category-card-top">
                    <span className={`category-icon tone-${index % 4}`}>
                      <FolderOpen size={21} />
                    </span>
                    <div>
                      <button
                        className="icon-button"
                        aria-label={`Editar ${category.name}`}
                        onClick={() => setEditing(category)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Excluir ${category.name}`}
                        onClick={() => {
                          mutation.reset();
                          setDeleting(category);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h2>{category.name}</h2>
                  <p>{category.description || 'Sem descrição adicional.'}</p>
                  <span className="category-footer">Categoria financeira</span>
                </article>
              ))}
            </div>
          )}
          <p className="page-note">
            Categorias vinculadas a transações são preservadas. Remova as transações antes de
            excluir a categoria.
          </p>
        </>
      )}
      {editing && (
        <CategoryForm
          category={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage('Categoria salva com sucesso.');
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          busy={mutation.isPending}
          error={mutation.isError ? errorMessage(mutation.error) : ''}
          onClose={() => setDeleting(null)}
          onConfirm={() => mutation.mutate(deleting.id)}
        />
      )}
    </>
  );
}
