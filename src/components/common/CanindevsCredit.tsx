import React from 'react';
import { clsx } from 'clsx';

interface CanindevsCreditProps {
  className?: string;
}

/** Crédito discreto de CANINDEVS para el panel de admin. */
export const CanindevsCredit: React.FC<CanindevsCreditProps> = ({ className }) => (
  <a
    href="https://canindevs.nandekuatia.com.py"
    target="_blank"
    rel="noopener noreferrer"
    className={clsx(
      'inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6F806D] opacity-80 hover:opacity-100 hover:text-[#C9D6C7] transition',
      className
    )}
  >
    <img src="/images/canindevs-icono.png" alt="" width={16} height={16} className="w-4 h-4" />
    <span>
      Desarrollado por <span className="font-semibold">CANINDEVS Software E.A.S.</span>
    </span>
  </a>
);
