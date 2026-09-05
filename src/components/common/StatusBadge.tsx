import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  active,
  activeText = 'Activo',
  inactiveText = 'Inactivo',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
        active
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-neutral-200 text-neutral-700 border border-neutral-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-neutral-400'
        }`}
      />
      {active ? activeText : inactiveText}
    </span>
  );
};
