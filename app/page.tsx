"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLang } from "@/lib/LanguageContext";

export default function LandingPage() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            {lang.hero_title}
          </h1>
          <p className="text-teal-100 text-base md:text-lg mb-3 max-w-xl mx-auto">
            {lang.hero_subtitle}
          </p>
          <p className="text-teal-200 text-sm mb-8">
            Gratis untuk 7 pesanan pertama. Tidak perlu kartu kredit. Tanpa komitmen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-gold-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-gold-600 transition-colors text-center"
              style={{ backgroundColor: "#C9A84C" }}
            >
              {lang.hero_cta_register}
            </Link>
            <Link
              href="/login"
              className="bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors text-center border border-white/30"
            >
              {lang.hero_cta_login}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard icon="📦" title={lang.feature1_title} desc={lang.feature1_desc} />
            <FeatureCard icon="🎁" title={lang.feature2_title} desc={lang.feature2_desc} />
            <FeatureCard icon="💬" title={lang.feature3_title} desc={lang.feature3_desc} />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-2">Harga yang Jujur</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Mulai gratis. Bayar hanya kalau bisnis kamu berkembang.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-bold text-gray-900 text-lg mb-1">Gratis</div>
              <div className="text-3xl font-extrabold text-teal-600 mb-3">Rp0</div>
              <p className="text-sm text-gray-600 flex-1">7 pesanan pertama per sesi gratis selamanya.<br />Tidak perlu kartu kredit. Tidak perlu daftar panjang.</p>
              <div className="mt-4 text-xs text-gray-400 font-medium uppercase tracking-wide">Selalu gratis</div>
            </div>
            {/* Session Unlock */}
            <div className="bg-white rounded-2xl border-2 border-teal-500 shadow-md p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">Populer</div>
              <div className="text-2xl mb-2">🔓</div>
              <div className="font-bold text-gray-900 text-lg mb-1">Unlock Sesi</div>
              <div className="text-3xl font-extrabold text-teal-600 mb-1">Rp 19.000</div>
              <div className="text-xs text-gray-400 mb-3">/ sesi</div>
              <p className="text-sm text-gray-600 flex-1">Pesanan tak terbatas untuk satu sesi preorder. Sekali bayar, selamanya.</p>
              <div className="mt-4 text-xs text-gray-400 font-medium uppercase tracking-wide">Per sesi</div>
            </div>
            {/* Monthly Pass */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold text-gray-900 text-lg mb-1">Monthly Pass</div>
              <div className="text-3xl font-extrabold text-teal-600 mb-1">Rp 49.000</div>
              <div className="text-xs text-gray-400 mb-3">/ bulan</div>
              <p className="text-sm text-gray-600 flex-1">Semua sesi, pesanan tak terbatas, selama 30 hari penuh.</p>
              <div className="mt-4 text-xs text-gray-400 font-medium uppercase tracking-wide">30 hari</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal-50 px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-teal-700 mb-3">Mulai Gratis Sekarang</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          7 pesanan pertama gratis. Bayar hanya kalau bisnis kamu berkembang.
        </p>
        <Link
          href="/register"
          className="inline-block bg-teal-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-teal-700 transition-colors"
        >
          {lang.hero_cta_register}
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm mt-auto">
        © {new Date().getFullYear()} Waitlistku — Dibuat untuk UMKM Indonesia 🇮🇩
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl shadow-sm border border-gray-100 p-6 bg-white hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
