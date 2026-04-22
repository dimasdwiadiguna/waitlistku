"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/LanguageContext";

interface Item {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  stock_quota: number | null;
}

export default function ItemModal({
  item,
  onClose,
  onSave,
}: {
  item: Partial<Item> | null;
  onClose: () => void;
  onSave: (data: Omit<Item, "id">) => Promise<void>;
}) {
  const { lang } = useLang();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock_quota: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        description: item.description || "",
        price: item.price?.toString() || "",
        stock_quota: item.stock_quota?.toString() || "",
      });
    }
  }, [item]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    await onSave({
      name: form.name,
      description: form.description,
      price: parseInt(form.price) || 0,
      stock_quota: form.stock_quota ? parseInt(form.stock_quota) : null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-4 text-white">
          <h2 className="font-bold text-lg">{item?.id ? lang.item_edit : lang.item_add}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.item_name} *</label>
            <input type="text" value={form.name} onChange={set("name")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nama produk" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.item_desc}</label>
            <textarea value={form.description} onChange={set("description")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 h-20 resize-none" placeholder="Deskripsi produk..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.item_price} (Rp) *</label>
            <input type="number" value={form.price} onChange={set("price")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.item_quota}</label>
            <input type="number" value={form.stock_quota} onChange={set("stock_quota")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder={lang.item_no_quota} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">{lang.btn_cancel}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60">{saving ? "Menyimpan..." : lang.btn_save}</button>
        </div>
      </div>
    </div>
  );
}
