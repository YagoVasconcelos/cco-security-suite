import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Indicador visual de ordenação com setinhas (ArrowUpDown, ArrowUp, ArrowDown)
 */
export function SortIndicator({ active, order = 'desc', activeColor = 'text-blue-400' }) {
  if (!active) {
    return (
      <span className="inline-flex items-center text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
        <ArrowUpDown className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-bold ml-1 shrink-0 animate-in fade-in zoom-in duration-150 ${activeColor}`}>
      {order === 'desc' ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUp className="w-3 h-3" />
      )}
    </span>
  );
}

/**
 * Componente Reutilizável de Cabeçalho Ordenável para Tabelas (th) ou Grades (div)
 */
export default function SortableHeader({
  field,
  label,
  currentField,
  currentOrder,
  onSort,
  as = 'th',
  className = '',
  title,
  activeColor = 'text-blue-400',
  align = 'left',
  children
}) {
  const Component = as;
  const isActive = currentField === field;
  const tooltip = title || (label ? `Clique para ordenar por ${label}` : 'Clique para ordenar');

  const alignClasses = 
    align === 'center' ? 'justify-center text-center' :
    align === 'right' ? 'justify-end text-right' :
    'justify-start text-left';

  return (
    <Component
      onClick={() => onSort && onSort(field)}
      className={`cursor-pointer select-none group transition-colors hover:text-white ${className}`}
      title={tooltip}
    >
      <div className={`inline-flex items-center gap-1 ${alignClasses} w-full`}>
        <span>{children || label}</span>
        <SortIndicator active={isActive} order={currentOrder} activeColor={activeColor} />
      </div>
    </Component>
  );
}

/**
 * Função utilitária padronizada para ordenação de listas de objetos
 */
export function compararValores(a, b, campo, direcao = 'asc') {
  let valA = a ? a[campo] : '';
  let valB = b ? b[campo] : '';

  if (valA === undefined || valA === null) valA = '';
  if (valB === undefined || valB === null) valB = '';

  let res = 0;
  if (typeof valA === 'string' && typeof valB === 'string') {
    res = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base', numeric: true });
  } else if (typeof valA === 'number' && typeof valB === 'number') {
    res = valA - valB;
  } else {
    res = String(valA).localeCompare(String(valB), 'pt-BR', { sensitivity: 'base', numeric: true });
  }

  return direcao === 'desc' ? -res : res;
}
