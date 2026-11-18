import { FolderOpen } from 'lucide-react';
import { money } from '../format';
import type { Summary } from '../types';
import { Empty } from './Feedback';

export function CategoryRanking({ categories }: { categories: Summary['topCategories'] }) {
  return (
    <section className="panel ranking-panel">
      <div className="panel-heading">
        <div>
          <h2>Para onde vai seu dinheiro</h2>
          <p>As 3 maiores categorias de saída no período</p>
        </div>
        <FolderOpen size={17} color="#a0ad91" />
      </div>
      {categories.length ? (
        <div className="category-ranking">
          {categories.map((category, index) => (
            <div className="rank-row" key={category.id}>
              <span className="rank-number">0{index + 1}</span>
              <span className={`category-icon tone-${index}`}>
                <FolderOpen size={16} />
              </span>
              <span className="rank-name">{category.name}</span>
              <strong>{money(category.amount)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Um novo começo"
          detail="Suas principais categorias aparecerão aqui quando você registrar saídas neste período."
        />
      )}
    </section>
  );
}
