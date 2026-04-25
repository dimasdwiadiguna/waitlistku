"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";
import AuthRightPanel from "@/components/AuthRightPanel";

function LoginForm() {
  const { lang, locale, toggleLang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bannedMsg, setBannedMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("banned") === "1") {
      setBannedMsg("Akun kamu dinonaktifkan. Hubungi kami untuk informasi lebih lanjut.");
    }
  }, [searchParams]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login gagal");
      } else {
        toast.success("Berhasil masuk!");
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
        <div className="flex-1 flex flex-col justify-center px-6 md:px-10 pb-6">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-[28px] font-bold text-gray-900 mb-1">
              {locale === "id" ? "Masuk ke akun kamu" : "Sign in to your account"}
            </h1>
            <p className="text-gray-500 text-sm mb-7">
              {locale === "id" ? "Kelola preorder bisnismu di sini" : "Manage your preorder business here"}
            </p>

            {bannedMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                {bannedMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang.login_email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F0F4F8] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B7285]/30 transition"
                  placeholder="email@contoh.com"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang.login_password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F0F4F8] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B7285]/30 transition"
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#0B7285] text-white font-bold py-3 rounded-lg shadow-sm hover:bg-[#085D6E] active:bg-[#064d5c] transition-colors disabled:opacity-60 mt-1"
              >
                {loading
                  ? locale === "id" ? "Memproses..." : "Processing..."
                  : lang.login_submit}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              {lang.login_no_account}{" "}
              <Link href="/register" className="text-[#0B7285] font-semibold hover:underline">
                {lang.login_register_link}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
