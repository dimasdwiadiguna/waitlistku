"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";
import { formatRp } from "@/lib/format";

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
  const [type, setType] = useState<"per_order" | "pack_100">("per_order");
  const [qty, setQty] = useState(10);
  const [loading, setLoading] = useState(false);

  const total = type === "pack_100" ? 20000 : qty * 500;

  const handleConfirm = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        payment_type: type,
        quantity: type === "per_order" ? qty : 100,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.slots_purchased} slot berhasil dibuka!`);
      onSuccess();
    } else {
      toast.error("Konfirmasi pembayaran gagal");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-4 text-white">
          <h2 className="font-bold text-lg">{lang.paywall_title}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Option 1 */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${type === "per_order" ? "border-teal-600 bg-teal-50" : "border-gray-200"}`}>
            <input type="radio" checked={type === "per_order"} onChange={() => setType("per_order")} className="mt-1 accent-teal-600" />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{lang.paywall_per_order}</div>
              <div className="text-sm text-teal-600 font-medium">{lang.paywall_per_order_price}</div>
              {type === "per_order" && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500">{lang.paywall_qty}</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
          </label>

          {/* Option 2 */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${type === "pack_100" ? "border-teal-600 bg-teal-50" : "border-gray-200"}`}>
            <input type="radio" checked={type === "pack_100"} onChange={() => setType("pack_100")} className="mt-1 accent-teal-600" />
            <div>
              <div className="font-semibold text-gray-900">{lang.paywall_pack_100}</div>
              <div className="text-sm text-teal-600 font-medium">{lang.paywall_pack_100_price}</div>
              <div className="text-xs text-gray-400 mt-0.5">Hemat Rp 30.000 vs per pesanan!</div>
            </div>
          </label>

          {/* QRIS placeholder */}
          <div className="bg-gray-100 rounded-xl h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-2">▦</div>
            <div className="text-sm font-medium">{lang.paywall_qris}</div>
            <div className="text-xs mt-1">{formatRp(total)}</div>
          </div>

          <div className="bg-amber-50 rounded-xl px-4 py-3 text-center">
            <span className="text-sm font-medium text-amber-700">{lang.paywall_total}: </span>
            <span className="text-lg font-bold text-amber-800">{formatRp(total)}</span>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50">{lang.btn_cancel}</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-60">
            {loading ? lang.paywall_processing : lang.paywall_paid}
          </button>
        </div>
      </div>
    </div>
  );
}
