'use client';

interface InterestButtonProps {
  propertyId: string;
  href: string;
}

export default function InterestButton({ propertyId, href }: InterestButtonProps) {
  const registerContact = () => {
    fetch(`/api/properties/${propertyId}/contact`, { method: 'POST' }).catch(() => {});
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registerContact}
      className="block w-full text-center px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
    >
      💬 Tenho Interesse
    </a>
  );
}
