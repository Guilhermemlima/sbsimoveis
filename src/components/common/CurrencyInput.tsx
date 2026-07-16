'use client';

interface CurrencyInputProps {
  value: string;
  onChange: (digitsOnly: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

function formatDigits(digits: string): string {
  if (!digits) return '';
  return Number(digits).toLocaleString('pt-BR');
}

export default function CurrencyInput({
  value,
  onChange,
  required,
  placeholder,
  id,
  className,
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.replace(/\D/g, ''));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        required={required}
        value={formatDigits(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={
          className ??
          'w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors'
        }
      />
    </div>
  );
}
