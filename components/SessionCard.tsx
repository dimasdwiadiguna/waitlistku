"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";
import { formatDate } from "@/lib/format";

interface Session {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  opens_at: string | null;
  closes_at: string | null;
  orders?: { count: number }[];
}

export default function SessionCard({
  session,
  onDelete,
}: {
  session: Session;
  onDelete: (id: string) => void;
}) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${session.slug}`;
  const orderCount =
    Array.isArray(session.orders) && session.orders[0]
      ? session.orders[0].count
      : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(lang.session_copied);
  };

  const handleDelete = async () => {
    if (!confirm("Hapus sesi ini? Semua data terkait akan dihapus.")) return;
    const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sesi berhasil dihapus");
      onDelete(session.id);
    } else {
      toast.error("Gagal menghapus sesi");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate">{session.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                session.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {session.is_active ? lang.session_active : lang.session_inactive}
            </span>
            <span className="text-xs text-gray-400">
              {orderCount} {lang.session_orders}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 bg-gray-50 rounded-lg px-2 py-1.5">
        <span className="text-xs text-gray-400 truncate flex-1">/p/{session.slug}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-teal-600 font-semibold shrink-0 hover:text-teal-700"
        >
          {copied ? "✓" : lang.session_copy}
        </button>
      </div>

      {(session.opens_at || session.closes_at) && (
        <div className="text-xs text-gray-400 mb-3 space-y-0.5">
          {session.opens_at && <div>Buka: {formatDate(session.opens_at)}</div>}
          {session.closes_at && <div>Tutup: {formatDate(session.closes_at)}</div>}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/dashboard/${session.id}`}
          className="flex-1 text-center text-sm font-semibold px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors min-w-0"
        >
          {lang.session_manage}
        </Link>
        <a
          href={`/p/${session.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:border-teal-600 hover:text-teal-600 transition-colors"
        >
          {lang.session_open_page}
        </a>
        <button
          onClick={handleDelete}
          className="text-sm font-medium px-3 py-2 border border-red-100 text-red-400 rounded-lg hover:border-red-400 hover:text-red-600 transition-colors"
        >
          {lang.session_delete}
        </button>
      </div>
    </div>
  );
}
