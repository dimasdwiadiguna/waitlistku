import { redirect } from "next/navigation";

export default function SaRootPage() {
  const saPath = process.env.SUPERADMIN_PATH || "sa-panel-x7k2q";
  redirect(`/${saPath}/users`);
}
