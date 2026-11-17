import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function Feedback({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null;
  const Icon = success ? CheckCircle2 : AlertCircle;
  return <div className={`feedback ${success ? 'success' : 'error'}`} role={success ? 'status' : 'alert'}><Icon size={18} /><span>{message}</span></div>;
}
export function Loading() { return <div className="empty-state" role="status"><LoaderCircle className="spin" size={24} /><p>Carregando seus dados…</p></div>; }
export function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div className="empty-symbol">↗</div><h3>{title}</h3><p>{detail}</p></div>;
}
