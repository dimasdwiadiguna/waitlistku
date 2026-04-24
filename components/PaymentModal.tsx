"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";

export default function PaymentModal({
  sessionId,
  onClose,
  onSuccess,
}: {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { lang } = useLang();
  const [selectedType, setSelectedType] = useState<"session_unlock" | "monthly_pass" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (type: "session_unlock" | "monthly_pass") => {
    setLoading(true);
    const res = await fetch("/api/subscriptions/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        type,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(lang.unlock_success);
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal memproses pembayaran");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-4 text-white">
          <h2 className="font-bold text-lg">{lang.paywall_title}</h2>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Session Unlock — primary option */}
          <div className="border-2 border-teal-600 rounded-xl bg-teal-50 p-4">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-base">{lang.paywall_session_title}</div>
                <div className="text-sm text-gray-600 mt-0.5">{lang.paywall_session_desc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-extrabold text-teal-700">{lang.paywall_session_price}</div>
                <div className="text-xs text-gray-400">{lang.paywall_session_price_note}</div>
              </div>
            </div>

            {/* QRIS placeholder */}
            <div className="bg-white rounded-xl h-36 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 mb-3">
              <div className="text-4xl mb-1">▦</div>
              <div className="text-sm font-medium">{lang.paywall_qris}</div>
              <div className="text-xs mt-0.5 font-semibold text-teal-600">{lang.paywall_session_price}</div>
            </div>

            <button
              onClick={() => handleConfirm("session_unlock")}
              disabled={loading}
              className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {loading ? lang.paywall_processing : lang.paywall_cta}
            </button>
          </div>

          {/* Monthly Pass — secondary option */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold text-gray-800 text-sm">{lang.paywall_monthly_title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{lang.paywall_monthly_desc}</div>
              </div>
            </div>
            <button
              onClick={() => handleConfirm("monthly_pass")}
              disabled={loading}
              className="w-full border border-gray-300 bg-white text-gray-700 font-semibold py-2 rounded-xl hover:bg-gray-100 disabled:opacity-60 transition-colors text-sm"
            >
              {loading ? lang.paywall_processing : lang.paywall_monthly_btn}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">{lang.paywall_monthly}</p>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            {lang.btn_cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
