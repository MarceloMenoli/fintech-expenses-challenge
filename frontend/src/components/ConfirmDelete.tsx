import { Modal } from './Modal';
import { Feedback } from './Feedback';

export function ConfirmDelete({ name, busy, error, onConfirm, onClose }: { name: string; busy: boolean; error: string; onConfirm: () => void; onClose: () => void }) {
  return <Modal title="Confirmar exclusão" onClose={onClose} busy={busy}><p className="delete-copy">Deseja excluir <strong>{name}</strong>? Esta ação não pode ser desfeita.</p><Feedback message={error} /><div className="form-actions"><button className="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="button danger" onClick={onConfirm} disabled={busy}>{busy ? 'Excluindo…' : 'Excluir'}</button></div></Modal>;
}
