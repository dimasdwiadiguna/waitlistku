"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";
import AuthRightPanel from "@/components/AuthRightPanel";

export default function RegisterPage() {
  const { lang, locale, toggleLang } = useLang();
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
    <div className="min-h-screen flex">
      {/* Left Panel — Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <Link href="/">
            <Image src="/logowlku.png" alt="Waitlistku" width={120} height={32} className="h-8 w-auto" />
          </Link>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {locale === "id" ? "ID" : "EN"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Form section */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-10 py-6">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-[28px] font-bold text-gray-900 mb-1">
              {locale === "id" ? "Buat akun baru" : "Create your account"}
            </h1>
            <p className="text-gray-500 text-sm mb-7">
              {locale === "id"
                ? "Bergabung dan mulai kelola preordermu"
                : "Join and start managing your preorders"}
            </p>

            <div className="space-y-4">
              <Field
                label={lang.register_business}
                type="text"
                value={form.business_name}
                onChange={set("business_name")}
                placeholder="Toko Berkah Jaya"
              />
              <Field
                label={lang.register_wa}
                type="tel"
                value={form.wa_number}
                onChange={set("wa_number")}
                placeholder="08123456789"
              />
              <Field
                label={lang.register_email}
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="email@contoh.com"
              />
              <Field
                label={lang.register_password}
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
              />
              <Field
                label={lang.register_confirm}
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="••••••••"
              />
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-[#0B7285] text-white font-bold py-3 rounded-lg shadow-sm hover:bg-[#085D6E] active:bg-[#064d5c] transition-colors disabled:opacity-60"
              >
                {loading
                  ? locale === "id" ? "Memproses..." : "Processing..."
                  : lang.register_submit}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              {lang.register_have_account}{" "}
              <Link href="/login" className="text-[#0B7285] font-semibold hover:underline">
                {lang.register_login_link}
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-gray-400 pb-5">
          Kelola preorder mudah dengan Waitlistku
        </p>
      </div>

      {/* Right Panel */}
      <AuthRightPanel />
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#F0F4F8] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B7285]/30 transition"
      />
    </div>
  );
}
