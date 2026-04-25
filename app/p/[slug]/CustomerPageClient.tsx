"use client";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import CountdownBanner from "@/components/CountdownBanner";
import { useLang } from "@/lib/LanguageContext";
import { formatRp, toWaNumber } from "@/lib/format";
import toast from "react-hot-toast";

interface SessionData {
  id: string;
  title: string;
  intro_text: string | null;
  footer_text: string | null;
  is_active: boolean;
  closes_at: string | null;
  opens_at: string | null;
  slug: string;
  primary_color: string | null;
  accent_color: string | null;
  payment_instructions: string | null;
  og_title: string | null;
  og_description: string | null;
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
  max_count: number | null;
  deadline: string | null;
  coupon_code: string | null;
  applies_to: string;
  item_id: string | null;
}
interface CartItem {
  item: Item;
  qty: number;
  unitPrice: number;
  promoName?: string;
}

export default function CustomerPageClient({ slug }: { slug: string }) {
  const { lang } = useLang();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [ownerWa, setOwnerWa] = useState("");
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Promo | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ queueNumber: number; waUrl: string } | null>(null);
  const [showPaymentAccordion, setShowPaymentAccordion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", wa: "", address: "" });
  const [itemOrderedQty, setItemOrderedQty] = useState<Record<string, number>>({});
  const [itemBuyerCount, setItemBuyerCount] = useState<Record<string, number>>({});
  const [sessionOrderCount, setSessionOrderCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: session, error: sessionError } = await supabaseClient
        .from("sessions")
        .select("*")
        .eq("slug", slug)
        .single();
      if (sessionError || !session) { setLoading(false); return; }

      const [itemsRes, promosRes, ordersCountRes, orderItemsRes] = await Promise.all([
        supabaseClient.from("items").select("*").eq("session_id", session.id).order("created_at"),
        supabaseClient.from("promos").select("*").eq("session_id", session.id),
        supabaseClient.from("orders").select("id", { count: "exact" }).eq("session_id", session.id).neq("status", "deleted"),
        supabaseClient.from("order_items").select("order_id, item_id, quantity, orders!inner(session_id, status)").eq("orders.session_id", session.id).neq("orders.status", "deleted"),
      ]);

      const orderedQtyMap: Record<string, number> = {};
      const buyerSetMap: Record<string, Set<string>> = {};
      for (const oi of orderItemsRes.data ?? []) {
        orderedQtyMap[oi.item_id] = (orderedQtyMap[oi.item_id] || 0) + oi.quantity;
        if (!buyerSetMap[oi.item_id]) buyerSetMap[oi.item_id] = new Set();
        buyerSetMap[oi.item_id].add(oi.order_id);
      }
      const buyerCountMap: Record<string, number> = {};
      for (const itemId in buyerSetMap) {
        buyerCountMap[itemId] = buyerSetMap[itemId].size;
      }
      setItemOrderedQty(orderedQtyMap);
      setItemBuyerCount(buyerCountMap);
      setSessionOrderCount(ordersCountRes.count || 0);

      setSessionData(session);
      setItems((itemsRes.data || []).filter((item) => item.is_visible !== false));
      setPromos(promosRes.data || []);
      const s = session;
      if (!s.is_active) { setClosed(true); }
      else if (s.closes_at && new Date(s.closes_at) < new Date()) { setClosed(true); }

      // Fetch owner WA via public API (users table is not publicly readable via anon client)
      const pubRes = await fetch(`/api/public/sessions/${slug}`);
      if (pubRes.ok) setOwnerWa((await pubRes.json()).owner_wa || "");
    } catch (err) {
      console.error("fetchData error", err);
    } finally {
      setLoading(false);
    }
  };

  const getFirstNPromoStatus = (item: Item): {
    promo: Promo; buyerCount: number; remaining: number; isExpired: boolean;
  } | null => {
    for (const promo of promos) {
      if (promo.promo_type !== "first_n_customers") continue;
      const applicable =
        promo.applies_to === "session" ||
        (promo.applies_to === "item" && promo.item_id === item.id);
      if (!applicable) continue;

      const buyerCount = promo.applies_to === "session"
        ? sessionOrderCount
        : (itemBuyerCount[item.id] || 0);
      const isExpired = promo.max_count !== null && buyerCount >= promo.max_count;
      const remaining = promo.max_count !== null ? Math.max(0, promo.max_count - buyerCount) : 0;
      return { promo, buyerCount, remaining, isExpired };
    }
    return null;
  };

  // Compute effective promos for an item
  const getEffectivePrice = (item: Item): { price: number; isPromo: boolean; promoName?: string } => {
    if (activeCoupon) {
      const applicable =
        (activeCoupon.applies_to === "session") ||
        (activeCoupon.applies_to === "item" && activeCoupon.item_id === item.id);
      if (applicable) return { price: activeCoupon.promo_price, isPromo: true, promoName: activeCoupon.name };
    }

    const firstNStatus = getFirstNPromoStatus(item);
    if (firstNStatus && !firstNStatus.isExpired) {
      return { price: firstNStatus.promo.promo_price, isPromo: true, promoName: firstNStatus.promo.name };
    }

    const now = new Date();
    for (const promo of promos) {
      if (promo.promo_type === "before_deadline" && promo.deadline) {
        if (new Date(promo.deadline) > now) {
          const applicable =
            (promo.applies_to === "session") ||
            (promo.applies_to === "item" && promo.item_id === item.id);
          if (applicable) return { price: promo.promo_price, isPromo: true, promoName: promo.name };
        }
      }
    }
    return { price: item.price, isPromo: false };
  };

  const getRemaining = (item: Item): number | null => {
    if (item.stock_quota === null) return null;
    const consumed = itemOrderedQty[item.id] || 0;
    return Math.max(0, item.stock_quota - consumed);
  };

  const setQty = (item: Item, qty: number) => {
    if (qty <= 0) {
      setCart((c) => { const n = { ...c }; delete n[item.id]; return n; });
      return;
    }
    const remaining = getRemaining(item);
    if (remaining !== null && qty > remaining) qty = remaining;
    const { price, promoName } = getEffectivePrice(item);
    setCart((c) => ({ ...c, [item.id]: { item, qty, unitPrice: price, promoName } }));
  };

  const addToCart = (item: Item) => {
    const current = cart[item.id]?.qty || 0;
    setQty(item, current + 1);
  };

  const totalItems = Object.values(cart).reduce((s, c) => s + c.qty, 0);
  const totalPrice = Object.values(cart).reduce((s, c) => s + c.unitPrice * c.qty, 0);

  const applyCoupon = () => {
    const promo = promos.find(
      (p) => p.promo_type === "coupon" && p.coupon_code?.toLowerCase() === couponInput.toLowerCase()
    );
    if (!promo) {
      toast.error(lang.customer_coupon_invalid);
      return;
    }
    setActiveCoupon(promo);
    // Re-price cart items
    setCart((c) => {
      const updated = { ...c };
      for (const id in updated) {
        const item = updated[id].item;
        const applicable =
          (promo.applies_to === "session") ||
          (promo.applies_to === "item" && promo.item_id === item.id);
        if (applicable) updated[id] = { ...updated[id], unitPrice: promo.promo_price };
      }
      return updated;
    });
    toast.success(lang.customer_coupon_applied);
  };

  const handleSubmitOrder = async () => {
    if (!orderForm.name || !orderForm.wa || !orderForm.address) {
      toast.error("Semua field wajib diisi");
      return;
    }
    if (totalItems === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }

    setSubmitting(true);
    const orderItems = Object.values(cart).map((c) => ({
      item_id: c.item.id,
      quantity: c.qty,
      unit_price: c.unitPrice,
    }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionData!.id,
        customer_name: orderForm.name,
        customer_wa: orderForm.wa,
        customer_address: orderForm.address,
        items: orderItems,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Gagal mengirim pesanan");
      return;
    }

    const data = await res.json();
    const queueNumber = data.queue_number;

    // Build WA confirmation message (opened only when customer clicks "Konfirmasi Pembayaran")
    const lines = Object.values(cart)
      .map((c) => `${c.item.name} x${c.qty} — ${formatRp(c.unitPrice * c.qty)}`)
      .join("\n");
    const msg = `Halo! Konfirmasi pesanan & pembayaran saya 🛍️\n${lines}\nTotal: ${formatRp(totalPrice)}\nNama: ${orderForm.name}\nWA: ${orderForm.wa}\nAlamat: ${orderForm.address}\nAntrian: #${queueNumber}\nTerlampir bukti pembayaran. Terima kasih!`;
    const waUrl = `https://wa.me/${toWaNumber(ownerWa)}?text=${encodeURIComponent(msg)}`;

    setShowPaymentAccordion(false);
    setOrderSuccess({ queueNumber, waUrl });
  };

  const hasCouponPromo = promos.some((p) => p.promo_type === "coupon");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-3 animate-bounce">⏳</div>
          <p>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="font-bold text-gray-800 text-xl mb-2">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-500">Link preorder ini tidak valid atau sudah dihapus.</p>
        </div>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-bold text-gray-800 text-xl mb-2">{lang.customer_closed}</h2>
          <p className="text-gray-500">{sessionData.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <CountdownBanner closesAt={sessionData.closes_at} />

      {/* Hero */}
      <div
        className="text-white px-4 py-10"
        style={{ background: sessionData.primary_color || "linear-gradient(135deg, #0d9488, #115e59)" }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-3">{sessionData.title}</h1>
          {sessionData.intro_text && <p className="text-teal-100 text-sm leading-relaxed">{sessionData.intro_text}</p>}
        </div>
        {items.length === 0 && !loading && (
          <div className="max-w-xl mx-auto px-4 mt-3 text-right">
            <button onClick={() => fetchData()} className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-lg">Reload items</button>
          </div>
        )}
      
      
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Active promos */}
        {promos.filter((p) => {
          if (p.promo_type === "before_deadline" && p.deadline) return new Date(p.deadline) > new Date();
          return p.promo_type === "first_n_customers" || p.promo_type === "coupon";
        }).map((promo) => (
          <div key={promo.id} className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: sessionData.accent_color || "#C9A84C", color: "white" }}>
            🎁 {promo.name} — {formatRp(promo.promo_price)}
            {promo.coupon_code && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">Kode: {promo.coupon_code}</span>}
          </div>
        ))}

        {/* Item cards */}
        <div className="space-y-3">
          {items.map((item) => {
            const { price, isPromo, promoName } = getEffectivePrice(item);
            const firstNStatus = getFirstNPromoStatus(item);
            const remaining = getRemaining(item);
            const isOutOfStock = remaining !== null && remaining <= 0;
            const atLimit = remaining !== null && (cart[item.id]?.qty || 0) >= remaining;
            const qty = cart[item.id]?.qty || 0;

            return (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-4 ${isOutOfStock ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {isOutOfStock && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">{lang.customer_habis}</span>
                      )}
                      {firstNStatus && !firstNStatus.isExpired && !isOutOfStock && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                          {lang.promo_first_n_remaining.replace("{count}", String(firstNStatus.remaining))}
                        </span>
                      )}
                      {firstNStatus && firstNStatus.isExpired && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                          {lang.promo_first_n_expired}
                        </span>
                      )}
                      {isPromo && !isOutOfStock && !firstNStatus && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: sessionData.accent_color || "#C9A84C", color: "white" }}>{lang.customer_promo_badge}</span>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {isPromo ? (
                        <>
                          <span className="font-bold text-teal-600">{formatRp(price)}</span>
                          <span className="text-xs text-gray-400 line-through">{formatRp(item.price)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-800">{formatRp(item.price)}</span>
                      )}
                      {remaining !== null && remaining > 0 && (
                        <span className="text-xs text-gray-400">Sisa: {remaining}</span>
                      )}
                    </div>
                    {remaining !== null && item.stock_quota! > 0 && (
                      <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            remaining / item.stock_quota! > 0.5
                              ? "bg-teal-500"
                              : remaining / item.stock_quota! > 0.2
                              ? "bg-amber-400"
                              : "bg-red-400"
                          }`}
                          style={{ width: `${Math.max(0, (remaining / item.stock_quota!) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {!isOutOfStock && (
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setQty(item, qty - 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center text-sm"
                          >−</button>
                          <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                          <button
                            onClick={() => setQty(item, qty + 1)}
                            disabled={atLimit}
                            className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold hover:bg-teal-700 flex items-center justify-center text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="text-xs font-semibold px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          {lang.customer_add_to_cart}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon input */}
        {hasCouponPromo && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-2">Punya kode promo?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={lang.customer_coupon_placeholder}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={applyCoupon}
                className="bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-teal-700"
              >
                {lang.customer_coupon_apply}
              </button>
            </div>
            {activeCoupon && (
              <p className="text-xs text-green-600 mt-2 font-medium">✓ Kupon "{activeCoupon.name}" diterapkan</p>
            )}
          </div>
        )}

        {/* Footer */}
        {sessionData.footer_text && (
          <div className="text-center text-sm text-gray-500 py-2">{sessionData.footer_text}</div>
        )}
        <div className="text-center text-xs text-gray-300 py-2">{lang.customer_made_with}</div>
      </div>

      {/* Sticky Promo Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5">
          <p className="text-xs font-medium text-gray-600 leading-tight">Tertarik bikin halaman preorder seperti ini?</p>
          <a
            href="/register"
            className="shrink-0 bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            Buat gratis
          </a>
        </div>
      </div>

      {/* Sticky Cart Bar */}
      {totalItems > 0 && !showOrderModal && (
        <div className="fixed bottom-11 left-0 right-0 z-40 px-4 pb-2">
          <button
            onClick={() => setShowOrderModal(true)}
            className="w-full max-w-xl mx-auto block bg-teal-600 text-white rounded-xl py-4 px-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-white text-teal-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{totalItems}</span>
                <span className="font-semibold text-sm">{totalItems} {lang.customer_items_selected}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatRp(totalPrice)}</span>
                <span className="font-semibold text-sm bg-white/20 px-3 py-1 rounded-lg">{lang.customer_order_now} →</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {orderSuccess ? (
              <div className="px-6 py-8">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">{lang.customer_success_title}</h2>
                  <p className="text-gray-500 text-sm mb-4">{lang.customer_success_note}</p>
                  <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-5 py-3">
                    <span className="text-sm text-teal-700 font-medium">{lang.customer_success_desc}</span>
                    <span className="text-3xl font-extrabold text-teal-600">#{orderSuccess.queueNumber}</span>
                  </div>
                </div>

                {/* Payment instructions accordion */}
                <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  <button
                    onClick={() => setShowPaymentAccordion((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
                  >
                    <span>💳 {lang.customer_payment_instructions}</span>
                    <span className="text-gray-400 text-xs">{showPaymentAccordion ? "▲" : "▼"}</span>
                  </button>
                  {showPaymentAccordion && (
                    <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {sessionData?.payment_instructions || "Hubungi penjual untuk informasi pembayaran."}
                    </div>
                  )}
                </div>

                {/* Confirm payment button (opens wa.me) */}
                <a
                  href={orderSuccess.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-colors text-sm mb-3"
                >
                  💬 {lang.customer_confirm_payment}
                </a>
                <button
                  onClick={() => { setShowOrderModal(false); setOrderSuccess(null); setCart({}); }}
                  className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">{lang.customer_order_summary}</h2>
                  <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                  {Object.values(cart).map((c) => {
                    const discountAmount = (c.item.price - c.unitPrice) * c.qty;
                    return (
                      <div key={c.item.id} className="space-y-0.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{c.item.name} <span className="text-gray-400">x{c.qty}</span></span>
                          <span className="font-medium text-gray-900">{formatRp(c.item.price * c.qty)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex items-center justify-between text-xs text-green-600">
                            <span>{lang.promo_discount} {c.promoName}</span>
                            <span>-{formatRp(discountAmount)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-teal-600">{formatRp(totalPrice)}</span>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang.customer_full_name} *</label>
                    <input
                      type="text"
                      value={orderForm.name}
                      onChange={(e) => setOrderForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang.customer_wa_number} *</label>
                    <input
                      type="tel"
                      value={orderForm.wa}
                      onChange={(e) => setOrderForm((f) => ({ ...f, wa: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="08123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang.customer_address} *</label>
                    <textarea
                      value={orderForm.address}
                      onChange={(e) => setOrderForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 h-20 resize-none"
                      placeholder="Jl. Contoh No. 1, Kota..."
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 text-sm"
                >
                  {submitting ? "Mengirim..." : `💬 ${lang.customer_send_wa}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
