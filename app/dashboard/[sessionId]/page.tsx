"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ItemModal from "@/components/ItemModal";
import PromoModal from "@/components/PromoModal";
import PaymentModal from "@/components/PaymentModal";
import { useLang } from "@/lib/LanguageContext";
import { formatRp, formatDateTime } from "@/lib/format";
import toast from "react-hot-toast";

interface Session {
  id: string;
  title: string;
  slug: string;
  intro_text: string | null;
  footer_text: string | null;
  opens_at: string | null;
  closes_at: string | null;
  is_active: boolean;
  owner_id: string;
}
interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quota: number | null;
}
interface Promo {
  id: string;
  name: string;
  promo_type: string;
  promo_price: number;
  max_count?: number | null;
  deadline?: string | null;
  coupon_code?: string | null;
  applies_to?: string;
  item_id?: string | null;
}
interface OrderItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  items: { name: string; price: number };
}
interface Order {
  id: string;
  queue_number: number;
  customer_name: string;
  customer_wa: string;
  customer_address: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  blurred?: boolean;
}

type Tab = "products" | "promos" | "orders";

export default function SessionPage() {
  const { lang } = useLang();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [items, setItems] = useState<Item[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [visibleLimit, setVisibleLimit] = useState(7);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Partial<Item> | null>(null);
  const [editPromo, setEditPromo] = useState<Partial<Promo> | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    title: "",
    intro_text: "",
    footer_text: "",
    opens_at: "",
    closes_at: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (tab === "products") fetchItems();
    else if (tab === "promos") fetchPromos();
    else if (tab === "orders") fetchOrders();
  }, [tab, sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setSession(data);
    setSettings({
      title: data.title || "",
      intro_text: data.intro_text || "",
      footer_text: data.footer_text || "",
      opens_at: data.opens_at ? data.opens_at.slice(0, 16) : "",
      closes_at: data.closes_at ? data.closes_at.slice(0, 16) : "",
      is_active: data.is_active ?? true,
    });
    setLoading(false);
    fetchItems();
  };

  const fetchItems = async () => {
    const res = await fetch(`/api/sessions/${sessionId}/items`);
    if (res.ok) setItems(await res.json());
  };

  const fetchPromos = async () => {
    const res = await fetch(`/api/sessions/${sessionId}/promos`);
    if (res.ok) setPromos(await res.json());
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/sessions/${sessionId}/orders`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders || []);
      setOrderTotal(data.total || 0);
      setVisibleLimit(data.visibleLimit || 7);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
    if (res.ok) {
      const data = await res.json();
      setSession(data);
      toast.success("Pengaturan disimpan");
    } else toast.error("Gagal menyimpan");
  };

  const handleSaveItem = async (data: Omit<Item, "id">) => {
    const isEdit = !!editItem?.id;
    const url = isEdit
      ? `/api/sessions/${sessionId}/items/${editItem!.id}`
      : `/api/sessions/${sessionId}/items`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success(isEdit ? "Produk diperbarui" : "Produk ditambahkan");
      setEditItem(null);
      fetchItems();
    } else toast.error("Gagal menyimpan produk");
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const res = await fetch(`/api/sessions/${sessionId}/items/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Produk dihapus"); fetchItems(); }
    else toast.error("Gagal menghapus");
  };

  const handleSavePromo = async (data: Omit<Promo, "id">) => {
    const isEdit = !!editPromo?.id;
    const url = isEdit
      ? `/api/sessions/${sessionId}/promos/${editPromo!.id}`
      : `/api/sessions/${sessionId}/promos`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success(isEdit ? "Promo diperbarui" : "Promo ditambahkan");
      setEditPromo(null);
      fetchPromos();
    } else toast.error("Gagal menyimpan promo");
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Hapus promo ini?")) return;
    const res = await fetch(`/api/sessions/${sessionId}/promos/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Promo dihapus"); fetchPromos(); }
    else toast.error("Gagal menghapus");
  };

  const handleApproveOrder = async (orderId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (res.ok) { toast.success("Pesanan disetujui"); fetchOrders(); }
    else toast.error("Gagal menyetujui");
  };

  const handleCancelOrder = async (orderId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    if (res.ok) { toast.success("Pesanan dibatalkan"); fetchOrders(); }
    else toast.error("Gagal membatalkan");
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(lang.order_confirm_delete)) return;
    const res = await fetch(`/api/sessions/${sessionId}/orders/${orderId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Pesanan dihapus"); fetchOrders(); }
    else toast.error("Gagal menghapus");
  };

  const handleSendWA = (order: Order) => {
    const lines = (order.order_items || [])
      .map((oi) => `${oi.items?.name} x${oi.quantity} — ${formatRp(oi.unit_price * oi.quantity)}`)
      .join("\n");
    const msg = `Halo! Saya ingin mengkonfirmasi preorder:\n${lines}\nTotal: ${formatRp(order.total_price)}\nNama: ${order.customer_name}\nAntrian: #${order.queue_number}\nStatus: DISETUJUI ✅`;
    window.open(`https://wa.me/${order.customer_wa.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleImportXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/sessions/${sessionId}/items/import`, { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) { toast.success(`${data.imported} produk diimpor`); fetchItems(); }
    else toast.error(data.error || "Gagal mengimpor");
    if (importRef.current) importRef.current.value = "";
  };

  const handleDownloadTemplate = () => {
    import("@/lib/xlsx").then(({ generateItemTemplate }) => {
      const blob = generateItemTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-produk.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleExportOrders = async () => {
    const res = await fetch(`/api/sessions/${sessionId}/orders/export`);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Gagal mengekspor");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pesanan-${session?.title || "export"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${session?.slug}`;
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(lang.session_copied);
  };

  const hasBlurred = orderTotal > visibleLimit;
  const visibleOrders = orders.filter((o) => !o.blurred);
  const approvedCount = visibleOrders.filter((o) => o.status === "approved").length;
  const revenue = visibleOrders.reduce((s, o) => s + (o.total_price || 0), 0);

  const promoTypeLabel = (type: string) => {
    if (type === "first_n_customers") return lang.promo_type_first_n;
    if (type === "before_deadline") return lang.promo_type_deadline;
    return lang.promo_type_coupon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isLoggedIn />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-100 rounded-xl w-1/3 mb-4 animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Settings panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-extrabold text-xl text-gray-900 truncate">{session?.title}</h1>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${session?.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {session?.is_active ? lang.session_active : lang.session_inactive}
            </span>
          </div>

          {/* Public URL */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-4">
            <span className="text-sm text-gray-500 truncate flex-1">{publicUrl}</span>
            <button onClick={handleCopyUrl} className="text-xs text-teal-600 font-semibold shrink-0 hover:text-teal-700">
              {copied ? "✓" : lang.session_copy}
            </button>
            <a href={`/p/${session?.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-teal-600 shrink-0">↗</a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">{lang.session_title_label}</label>
              <input value={settings.title} onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex items-center gap-2 sm:pt-5">
              <input type="checkbox" id="active" checked={settings.is_active} onChange={(e) => setSettings((s) => ({ ...s, is_active: e.target.checked }))} className="w-4 h-4 accent-teal-600" />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">{lang.session_active_toggle}</label>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">{lang.session_opens_at}</label>
              <input type="datetime-local" value={settings.opens_at} onChange={(e) => setSettings((s) => ({ ...s, opens_at: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">{lang.session_closes_at}</label>
              <input type="datetime-local" value={settings.closes_at} onChange={(e) => setSettings((s) => ({ ...s, closes_at: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">{lang.session_intro_label}</label>
              <textarea value={settings.intro_text} onChange={(e) => setSettings((s) => ({ ...s, intro_text: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 h-16 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">{lang.session_footer_label}</label>
              <input value={settings.footer_text} onChange={(e) => setSettings((s) => ({ ...s, footer_text: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="mt-4 bg-teal-600 text-white font-semibold px-5 py-2 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 text-sm">
            {savingSettings ? "Menyimpan..." : lang.btn_save}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(["products", "promos", "orders"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t ? "border-teal-600 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "products" ? lang.tab_products : t === "promos" ? lang.tab_promos : lang.tab_orders}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setEditItem({})} className="bg-teal-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors text-sm">
                + {lang.item_add}
              </button>
              <label className="cursor-pointer border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-xl hover:border-teal-600 hover:text-teal-600 transition-colors text-sm">
                {lang.btn_import}
                <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImportXlsx} className="hidden" />
              </label>
              <button onClick={handleDownloadTemplate} className="border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-xl hover:border-teal-600 hover:text-teal-600 transition-colors text-sm">
                {lang.btn_template}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-medium">{lang.item_empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{lang.item_name}</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">{lang.item_price}</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">{lang.item_quota}</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item) => (
                      <tr key={item.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{item.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-teal-700">{formatRp(item.price)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.stock_quota ?? lang.item_no_quota}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditItem(item)} className="text-xs text-teal-600 font-semibold hover:underline">{lang.btn_edit}</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-400 font-semibold hover:underline">{lang.btn_delete}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Promos Tab */}
        {tab === "promos" && (
          <div>
            <button onClick={() => setEditPromo({})} className="mb-4 bg-teal-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors text-sm">
              + {lang.promo_add}
            </button>

            {promos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🎁</div>
                <p className="font-medium">{lang.promo_empty}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {promos.map((promo) => (
                  <div key={promo.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{promo.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">{promoTypeLabel(promo.promo_type)}</span>
                        </div>
                        <div className="text-teal-600 font-bold">{formatRp(promo.promo_price)}</div>
                        {promo.coupon_code && <div className="text-xs text-gray-500 mt-1">Kode: <code className="bg-gray-100 px-1 rounded">{promo.coupon_code}</code></div>}
                        {promo.max_count && <div className="text-xs text-gray-500">Maks: {promo.max_count} pembeli</div>}
                        {promo.deadline && <div className="text-xs text-gray-500">Deadline: {formatDateTime(promo.deadline)}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditPromo(promo)} className="text-xs text-teal-600 font-semibold hover:underline">{lang.btn_edit}</button>
                        <button onClick={() => handleDeletePromo(promo.id)} className="text-xs text-red-400 font-semibold hover:underline">{lang.btn_delete}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-gray-900">{orderTotal}</div>
                <div className="text-xs text-gray-500 mt-0.5">{lang.order_total_label}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-green-600">{approvedCount}</div>
                <div className="text-xs text-gray-500 mt-0.5">{lang.order_approved_label}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <div className="text-sm font-extrabold text-teal-600">{formatRp(revenue)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{lang.order_revenue_label}</div>
              </div>
            </div>

            {/* Paywall banner */}
            {hasBlurred && (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full mb-4 text-center py-3 px-4 rounded-xl font-semibold text-sm"
                style={{ background: "#C9A84C", color: "white" }}
              >
                {lang.paywall_banner.replace("{count}", String(orderTotal - visibleLimit))}
              </button>
            )}

            {/* Export button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={handleExportOrders}
                disabled={hasBlurred}
                title={hasBlurred ? lang.order_export_disabled : ""}
                className="border border-gray-200 text-gray-600 font-medium px-4 py-2 rounded-xl hover:border-teal-600 hover:text-teal-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↓ {lang.btn_export}
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-medium">{lang.order_empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_num}</th>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_name}</th>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_wa}</th>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_items}</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_total}</th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_status}</th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{lang.order_actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => {
                      if (order.blurred) {
                        return (
                          <tr key={order.id} className="bg-white relative">
                            <td className="px-3 py-3 blur-paywall">#{order.queue_number}</td>
                            <td className="px-3 py-3 blur-paywall">████████</td>
                            <td className="px-3 py-3 blur-paywall">08xxxxxxxx</td>
                            <td className="px-3 py-3 blur-paywall">Item A x1</td>
                            <td className="px-3 py-3 blur-paywall text-right">Rp xx.xxx</td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                                🔒
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">—</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={order.id} className="bg-white hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-700">#{order.queue_number}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900 whitespace-nowrap">{order.customer_name}</div>
                            <div className="text-xs text-gray-400">{formatDateTime(order.created_at)}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{order.customer_wa}</td>
                          <td className="px-3 py-3 max-w-xs">
                            <div className="text-xs text-gray-600">
                              {(order.order_items || []).map((oi) => (
                                <div key={oi.item_id}>{oi.items?.name} x{oi.quantity}</div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-teal-700 whitespace-nowrap">{formatRp(order.total_price)}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              order.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {order.status === "approved" ? lang.order_status_approved : lang.order_status_pending}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1.5 justify-center flex-wrap">
                              {order.status === "pending" && (
                                <button onClick={() => handleApproveOrder(order.id)} className="text-xs text-green-600 font-semibold hover:underline whitespace-nowrap">{lang.order_approve}</button>
                              )}
                              {order.status === "approved" && (
                                <button onClick={() => handleCancelOrder(order.id)} className="text-xs text-orange-500 font-semibold hover:underline whitespace-nowrap">{lang.order_cancel}</button>
                              )}
                              <button onClick={() => handleSendWA(order)} className="text-xs text-teal-600 font-semibold hover:underline whitespace-nowrap">{lang.order_send_wa}</button>
                              <button onClick={() => handleDeleteOrder(order.id)} className="text-xs text-red-400 font-semibold hover:underline whitespace-nowrap">{lang.order_delete}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {editItem !== null && (
        <ItemModal item={editItem} onClose={() => setEditItem(null)} onSave={handleSaveItem} />
      )}
      {editPromo !== null && (
        <PromoModal promo={editPromo} items={items} onClose={() => setEditPromo(null)} onSave={handleSavePromo} />
      )}
      {showPayment && (
        <PaymentModal sessionId={sessionId} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); fetchOrders(); }} />
      )}
    </div>
  );
}
