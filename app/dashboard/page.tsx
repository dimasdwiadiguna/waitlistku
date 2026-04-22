"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SessionCard from "@/components/SessionCard";
import { useLang } from "@/lib/LanguageContext";
import toast from "react-hot-toast";

interface Session {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  opens_at: string | null;
  closes_at: string | null;
  orders?: { count: number }[];
}

export default function DashboardPage() {
  const { lang } = useLang();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    intro_text: "",
    footer_text: "",
    opens_at: "",
    closes_at: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Gagal membuat sesi");
    } else {
      toast.success("Sesi berhasil dibuat!");
      setShowModal(false);
      setForm({ title: "", intro_text: "", footer_text: "", opens_at: "", closes_at: "", is_active: true });
      fetchSessions();
    }
  };

  const handleDelete = (id: string) => {
    setSessions((s) => s.filter((sess) => sess.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">{lang.dashboard_title}</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors text-sm"
          >
            + {lang.dashboard_new}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-medium">{lang.dashboard_empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="bg-teal-600 rounded-t-2xl px-6 py-4 text-white">
              <h2 className="font-bold text-lg">{lang.modal_new_session}</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <FormField label={lang.session_title_label} required>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-base"
                  placeholder="Pre-order Baju Lebaran 2025"
                />
              </FormField>
              <FormField label={lang.session_intro_label}>
                <textarea
                  value={form.intro_text}
                  onChange={(e) => setForm((f) => ({ ...f, intro_text: e.target.value }))}
                  className="input-base h-20 resize-none"
                  placeholder="Selamat datang di sesi preorder kami..."
                />
              </FormField>
              <FormField label={lang.session_footer_label}>
                <input
                  type="text"
                  value={form.footer_text}
                  onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                  className="input-base"
                  placeholder="Terima kasih telah berbelanja!"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={lang.session_opens_at}>
                  <input
                    type="datetime-local"
                    value={form.opens_at}
                    onChange={(e) => setForm((f) => ({ ...f, opens_at: e.target.value }))}
                    className="input-base"
                  />
                </FormField>
                <FormField label={lang.session_closes_at}>
                  <input
                    type="datetime-local"
                    value={form.closes_at}
                    onChange={(e) => setForm((f) => ({ ...f, closes_at: e.target.value }))}
                    className="input-base"
                  />
                </FormField>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-teal-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  {lang.session_active_toggle}
                </label>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {lang.btn_cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {creating ? "Membuat..." : lang.btn_create}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-base:focus {
          ring: 2px;
          border-color: #0B7285;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
