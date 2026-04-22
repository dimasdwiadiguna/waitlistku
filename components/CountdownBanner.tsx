"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/LanguageContext";
import { formatCountdown } from "@/lib/format";

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
    return (
      <div className="sticky top-0 z-40 text-center py-2.5 px-4 text-sm font-semibold" style={{ background: "#C9A84C", color: "white" }}>
        {lang.customer_countdown} {formatCountdown(ms)}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-teal-600 text-white text-center py-2.5 px-4 text-sm font-semibold">
      {lang.customer_urgency}
    </div>
  );
}
