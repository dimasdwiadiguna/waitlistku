const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "5 menit buat sesi preorder",
    desc: "Buat sesi preorder dengan mudah untuk menampung pesanan yang masuk tanpa tercecer di berbagai chat whatsapp",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    title: "Promo & Diskon",
    desc: "Buat promo yang mendorong konsumen untuk ikut dalam preordermu",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Semua tahu Kuota",
    desc: "Sudahi pertanyaan 'Masih bisa pesan?' dari konsumenmu. Semua tahu kuota dan batas waktu preorder dengan transparan",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Pesanan via WhatsApp",
    desc: "Semua pesanan tetap akan dikirim via WhatsApp, sehingga diskusi lebih lanjut bisa dilanjutkan disana",
  },
];

export default function AuthRightPanel() {
  return (
    <div
      className="hidden md:sticky md:top-0 md:h-screen md:flex md:w-[55%] flex-col overflow-hidden"
      style={{ background: "linear-gradient(145deg, #0B7285 0%, #065a6b 60%, #054f60 100%)" }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-[38%] -left-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-20 right-[20%] w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-[55%] right-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 py-12 xl:px-14">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-white/80 text-xs font-medium">Dipercaya ribuan penjual</span>
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold text-white leading-snug mb-2">
            Satu platform untuk<br />semua preordermu
          </h2>
          <p className="text-white/60 text-sm">Mulai gratis, tanpa kartu kredit</p>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{f.title}</p>
                <p className="text-white/60 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing teaser */}
        <div className="mt-8 pt-6 border-t border-white/15">
          <p className="text-white font-semibold text-sm mb-2">
            Start free. Pay only when your business grows.
          </p>
          <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/85 text-xs px-3 py-1.5 rounded-full">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            First 7 orders free · Bayar mulai dari Rp19.000 per sesi
          </div>
        </div>
      </div>
    </div>
  );
}
