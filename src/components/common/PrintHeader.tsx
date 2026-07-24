export default function PrintHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="hidden print:flex items-center gap-3 mb-6 pb-4 border-b-2 border-gold-500">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500 text-navy-950 font-bold text-xl">
        S
      </span>
      <div>
        <p className="text-lg font-bold text-navy-950">SBS Imóveis</p>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
}
