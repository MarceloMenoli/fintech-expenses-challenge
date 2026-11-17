import { useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Feedback } from '../components/Feedback';
import { Logo } from '../components/Layout';
import type { Envelope, Session } from '../types';

export function AuthPage({ register = false }: { register?: boolean }) {
  const { user, authenticate, expired } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const data = { email: String(form.get('email')), password: String(form.get('password')), ...(register ? { name: String(form.get('name')) } : {}) };
    try { authenticate((await api.post<Envelope<Session>>(`/auth/${register ? 'register' : 'login'}`, data)).data.data); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><section className="auth-story"><Logo /><div><span className="eyebrow">MENOS PLANILHAS. MAIS CLAREZA.</span><h1>Seu próximo passo<br />começa com<br /><em>organização.</em></h1><p>Entradas, despesas e decisões.<br />Tudo conectado em um único lugar.</p><ul>{['Acompanhe seu saldo em tempo real', 'Entenda para onde seu dinheiro vai', 'Organize cada movimentação'].map((text) => <li key={text}><Check size={17} />{text}</li>)}</ul></div><small>Uma visão simples. Um futuro mais tranquilo.</small></section>
    <section className="auth-form-wrap"><form className="auth-form" onSubmit={submit} key={register ? 'register' : 'login'}><span className="eyebrow">BEM-VINDO AO FLUXO</span><h2>{register ? 'Comece sua organização' : 'Bom ter você de volta.'}</h2><p>{register ? 'Crie sua conta e dê clareza às suas finanças.' : 'Entre para acompanhar suas finanças.'}</p>
      {expired && <Feedback message="Sua sessão expirou. Entre novamente para continuar." />}
      <Feedback message={error} />
      {register && <label>Nome<input name="name" autoComplete="name" placeholder="Seu nome completo" minLength={2} maxLength={100} required /></label>}
      <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" maxLength={254} required /></label>
      <label>Senha<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Pelo menos 8 caracteres' : 'Sua senha'} minLength={8} maxLength={72} required /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar na minha conta'}<ArrowRight size={18} /></button>
      <p className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <Link to={register ? '/login' : '/register'}>{register ? 'Entrar' : 'Criar conta'}</Link></p>
      {!register && <div className="demo-note"><strong>Explore a demonstração</strong><span>demo@fluxo.app · Demo@2026!</span></div>}
    </form></section></div>;
}
