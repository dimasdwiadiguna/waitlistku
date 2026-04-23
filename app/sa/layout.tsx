import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function SaRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", color: "#E2E8F0" }}>
      {children}
    </div>
  );
}
