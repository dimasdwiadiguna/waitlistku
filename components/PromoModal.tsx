"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/LanguageContext";

interface Item { id: string; name: string; }
interface Promo {
  id?: string;
  name: string;
  promo_type: string;
  promo_price: number;
  max_count?: number | null;
  deadline?: string | null;
  coupon_code?: string | null;
  applies_to?: string;
  item_id?: string | null;
}

export default function PromoModal({
  promo,
  items,
  onClose,
  onSave,
}: {
  promo: Partial<Promo> | null;
  items: Item[];
  onClose: () => void;
  onSave: (data: Omit<Promo, "id">) => Promise<void>;
}) {
  const { lang } = useLang();
  const [form, setForm] = useState({
    name: "",
    promo_type: "first_n_customers",
    promo_price: "",
    max_count: "",
    deadline: "",
    coupon_code: "",
    applies_to: "session",
    item_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (promo) {
      setForm({
        name: promo.name || "",
        promo_type: promo.promo_type || "first_n_customers",
        promo_price: promo.promo_price?.toString() || "",
        max_count: promo.max_count?.toString() || "",
        deadline: promo.deadline || "",
        coupon_code: promo.coupon_code || "",
        applies_to: promo.applies_to || "session",
        item_id: promo.item_id || "",
      });
    }
  }, [promo]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.promo_price) return;
    setSaving(true);
    await onSave({
      name: form.name,
      promo_type: form.promo_type,
      promo_price: parseInt(form.promo_price) || 0,
      max_count: form.max_count ? parseInt(form.max_count) : null,
      deadline: form.deadline || null,
      coupon_code: form.coupon_code || null,
      applies_to: form.applies_to,
      item_id: form.item_id || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-4 text-white">
          <h2 className="font-bold text-lg">{promo?.id ? lang.promo_edit : lang.promo_add}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label={lang.promo_name + " *"}>
            <input type="text" value={form.name} onChange={set("name")} className="input-base" placeholder="Early Bird Discount" />
          </Field>
          <Field label={lang.promo_type}>
            <select value={form.promo_type} onChange={set("promo_type")} className="input-base">
              <option value="first_n_customers">{lang.promo_type_first_n}</option>
              <option value="before_deadline">{lang.promo_type_deadline}</option>
              <option value="coupon">{lang.promo_type_coupon}</option>
            </select>
          </Field>
          <Field label={lang.promo_price + " (Rp) *"}>
            <input type="number" value={form.promo_price} onChange={set("promo_price")} className="input-base" placeholder="40000" />
          </Field>

          {form.promo_type === "first_n_customers" && (
            <>
              <Field label={lang.promo_max_count}>
                <input type="number" value={form.max_count} onChange={set("max_count")} className="input-base" placeholder="10" />
              </Field>
              <Field label={lang.promo_applies_to}>
                <select value={form.applies_to} onChange={set("applies_to")} className="input-base">
                  <option value="session">{lang.promo_applies_session}</option>
                  <option value="item">{lang.promo_applies_item}</option>
                </select>
              </Field>
              {form.applies_to === "item" && (
                <Field label={lang.promo_select_item}>
                  <select value={form.item_id} onChange={set("item_id")} className="input-base">
                    <option value="">-- Pilih Item --</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}

          {form.promo_type === "before_deadline" && (
            <Field label={lang.promo_deadline}>
              <input type="datetime-local" value={form.deadline} onChange={set("deadline")} className="input-base" />
            </Field>
          )}

          {form.promo_type === "coupon" && (
            <Field label={lang.promo_coupon_code}>
              <input type="text" value={form.coupon_code} onChange={set("coupon_code")} className="input-base" placeholder="HEMAT20" />
            </Field>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50">{lang.btn_cancel}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-60">{saving ? "Menyimpan..." : lang.btn_save}</button>
        </div>
      </div>
      <style jsx>{`.input-base { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
