import { useEffect, useState } from 'react';

interface TrialExpiredModalProps {
  open: boolean;
  message: string;
  redirectUrl?: string;
}

export default function TrialExpiredModal({ open, message, redirectUrl = '/landingpage' }: TrialExpiredModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(5);
    const countdown = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    const timer = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [open, redirectUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Trial expirado</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              window.location.href = redirectUrl;
            }}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Ver planos
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Redirecionando automaticamente em {secondsLeft}s...
        </p>
      </div>
    </div>
  );
}
