"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/LanguageContext";
import { formatCountdownParts } from "@/lib/format";

function FlipTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {value.split("").map((digit, i) => (
          <span
            key={i}
            className="inline-block bg-gray-900 text-white font-mono font-bold text-base sm:text-xl leading-none px-1.5 py-1 rounded min-w-[1.4rem] text-center tabular-nums"
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}

export default function CountdownBanner({ closesAt }: { closesAt: string | null }) {
  const { lang } = useLang();
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (!closesAt) return;
    const tick = () => setMs(new Date(closesAt).getTime() - Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [closesAt]);

  if (closesAt && ms !== null) {
    if (ms <= 0) return null;
    const parts = formatCountdownParts(ms);
    return (
      <div className="sticky top-0 z-40 py-3 px-4 text-white text-center" style={{ background: "#C9A84C" }}>
        <p className="text-xs font-semibold mb-2 opacity-90">{lang.customer_countdown}</p>
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          <FlipTile value={parts.days} label={lang.countdown_days} />
          <span className="text-white font-bold text-xl mb-4 opacity-50">:</span>
          <FlipTile value={parts.hours} label={lang.countdown_hours} />
          <span className="text-white font-bold text-xl mb-4 opacity-50">:</span>
          <FlipTile value={parts.minutes} label={lang.countdown_minutes} />
          <span className="text-white font-bold text-xl mb-4 opacity-50">:</span>
          <FlipTile value={parts.seconds} label={lang.countdown_seconds} />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-teal-600 text-white text-center py-2.5 px-4 text-sm font-semibold">
      {lang.customer_urgency}
    </div>
  );
}
