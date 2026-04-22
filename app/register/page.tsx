"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";

export default function RegisterPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    business_name: "",
    wa_number: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.business_name || !form.wa_number) {
      toast.error("Semua field wajib diisi");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Password tidak cocok");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          business_name: form.business_name,
          wa_number: form.wa_number,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mendaftar");
      } else {
        toast.success("Akun berhasil dibuat!");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-5 text-white text-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight block mb-1">
            Waitlistku
          </Link>
          <h1 className="font-semibold text-lg">{lang.register_title}</h1>
        </div>
        <div className="bg-white rounded-b-2xl shadow-sm px-6 py-6 space-y-4">
          <Field label={lang.register_business} type="text" value={form.business_name} onChange={set("business_name")} placeholder="Toko Berkah Jaya" />
          <Field label={lang.register_wa} type="tel" value={form.wa_number} onChange={set("wa_number")} placeholder="08123456789" />
          <Field label={lang.register_email} type="email" value={form.email} onChange={set("email")} placeholder="email@contoh.com" />
          <Field label={lang.register_password} type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
          <Field label={lang.register_confirm} type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" />
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : lang.register_submit}
          </button>
          <p className="text-center text-sm text-gray-500">
            {lang.register_have_account}{" "}
            <Link href="/login" className="text-teal-600 font-semibold hover:underline">
              {lang.register_login_link}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}
