"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

interface MeData {
  business_name: string;
  role: string;
}

export default function Navbar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const { lang, locale, toggleLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 403) {
          // Banned — force logout
          fetch("/api/auth/logout", { method: "POST" }).then(() => {
            router.push("/login?banned=1");
          });
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => data && setMe(data))
      .catch(() => null);
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
    toast.success("Berhasil keluar");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-teal-600 text-lg tracking-tight">
          Waitlistku
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-colors"
          >
            {locale === "id" ? "EN" : "ID"}
          </button>

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/dashboard")
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:text-teal-600"
                }`}
              >
                {me?.business_name || lang.nav_dashboard}
                {me?.role === "tester" && (
                  <span
                    style={{
                      background: "rgba(108,99,255,0.15)",
                      color: "#6C63FF",
                      border: "1px solid rgba(108,99,255,0.4)",
                      borderRadius: "999px",
                      padding: "0 0.4rem",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    TESTER
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:text-red-500 transition-colors"
              >
                {lang.nav_logout}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium px-3 py-1.5 text-gray-600 hover:text-teal-600 transition-colors"
              >
                {lang.nav_login}
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {lang.nav_register}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
