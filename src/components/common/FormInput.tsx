import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#2D3A2F] placeholder-[#8A9588] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] focus:border-transparent ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-[#D9D3C7]'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#7A8677]">{helperText}</p>}
    </div>
  );
};
