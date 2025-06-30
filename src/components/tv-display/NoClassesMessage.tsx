
import { MonitorX } from 'lucide-react';

export default function NoClassesMessage() {
  return (
    <div className="no-classes-card">
      <MonitorX className="message-icon" size={64} />
      <p className="message-text">Nenhuma Turma em Andamento</p>
      <p className="message-subtext">O painel será atualizado automaticamente quando houver aulas.</p>
    </div>
  );
}
