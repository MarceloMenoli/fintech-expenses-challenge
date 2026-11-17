export interface User { id: string; name: string; email: string }
export interface Session { user: User; accessToken: string }
export interface Category { id: string; name: string; description: string | null }
export type TransactionType = 'INCOME' | 'EXPENSE';
export interface Transaction {
  id: string; description: string; amount: number; type: TransactionType;
  date: string; categoryId: string; category: Pick<Category, 'id' | 'name'>;
}
export interface TransactionInput {
  description: string; amount: number; type: TransactionType; date: string; categoryId: string;
}
export interface Summary {
  balance: number; income: number; expense: number;
  topCategories: { id: string; name: string; amount: number }[];
}
export interface Envelope<T> { data: T }
export interface Page<T> extends Envelope<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}
