import type { TvDisplayInfo } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Gera um prefixo de classe CSS a partir do nome do curso/turma.
 * Isto permite estilizar os cartões de forma diferente com base no tipo de curso.
 * @param {string} groupName - O nome do grupo/turma, ex: "FMC10".
 * @returns {string} Um prefixo de classe como 'fmc', 'rad', 'enf', 'adm', ou 'default'.
 */
const getCoursePrefix = (groupName: string): string => {
  if (!groupName) return 'default';
  const upperGroupName = groupName.toUpperCase();
  if (upperGroupName.startsWith('FMC')) return 'fmc';
  if (upperGroupName.startsWith('RAD')) return 'rad';
  if (upperGroupName.startsWith('ENF')) return 'enf';
  if (upperGroupName.startsWith('ADM')) return 'adm';
  return 'default';
};

/**
 * Componente que renderiza um único cartão de informação para o painel de TV.
 * O seu estilo (cor, etc.) muda com base no tipo de curso e se uma sala está atribuída.
 * @param {{ item: TvDisplayInfo }} props - As propriedades do componente, contendo as informações da turma.
 */
export default function TvCard({ item }: { item: TvDisplayInfo }) {
  const isAssigned = item.classroomName !== 'Não Atribuída';

  // Determina a classe de cor do cartão com base no curso.
  // Se a sala não estiver atribuída, usa um estilo especial de 'não atribuído'.
  const cardColorClass = isAssigned
    ? `card-${getCoursePrefix(item.groupName)}`
    : 'card-unassigned';

  return (
    // O div principal do cartão, combinando classes base e de cor.
    <div className={cn('card', cardColorClass)}>
      
      {/* Secção de conteúdo principal do cartão (cresce para preencher o espaço) */}
      <div className="flex-grow">
        <div className="card-title">{item.groupName}</div>
        <div className={cn('card-value', { 'not-assigned': !isAssigned })}>
          {item.classroomName}
        </div>
      </div>

      {/* Rodapé do cartão para informações secundárias */}
      <div className="card-footer-info">
        {item.shift}
      </div>
    </div>
  );
}
