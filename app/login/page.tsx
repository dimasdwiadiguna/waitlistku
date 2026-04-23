"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useLang } from "@/lib/LanguageContext";
import { Suspense } from "react";

function LoginForm() {
  const { lang } = useLang();
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-teal-600 rounded-t-2xl px-6 py-5 text-white text-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight block mb-1">
            Waitlistku
          </Link>
          <h1 className="font-semibold text-lg">{lang.login_title}</h1>
        </div>
        <div className="bg-white rounded-b-2xl shadow-sm px-6 py-6 space-y-4">
          {bannedMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {bannedMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.login_email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="email@contoh.com"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{lang.login_password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : lang.login_submit}
          </button>
          <p className="text-center text-sm text-gray-500">
            {lang.login_no_account}{" "}
            <Link href="/register" className="text-teal-600 font-semibold hover:underline">
              {lang.login_register_link}
            </Link>
          </p>
        </div>
      </div>
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
