"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import toast from "react-hot-toast";

export default function Navbar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const { lang, locale, toggleLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();

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
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/dashboard")
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:text-teal-600"
                }`}
              >
                {lang.nav_dashboard}
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
