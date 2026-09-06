import { useEffect, useState } from "react";

interface Props {
  expiresAt: string;
  onExpired: () => void;
}

export function QuoteCountdown({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(
      0,
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
    ),
  );

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const sec = Math.max(0, Math.floor((expires - now) / 1000));

      setRemaining(sec);

      if (sec === 0) {
        clearInterval(interval);
        onExpired();
      }
    };
    update();
    const interval = setInterval(update, 250);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = (remaining / 75) * 100;

  return (
    <div className="space-y-2">
      <div className="text-3xl font-mono font-semibold text-[#0D4A46]">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-[#8CCB50] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
