import SaSidebar from "@/components/sa/SaSidebar";

export default function SaPanelLayout({ children }: { children: React.ReactNode }) {
  const saPath = process.env.SUPERADMIN_PATH || "sa-panel-x7k2q";
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SaSidebar saPath={saPath} />
      <main style={{ flex: 1, overflowX: "hidden" }}>{children}</main>
    </div>
  );
}
