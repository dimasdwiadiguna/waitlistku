"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SaTransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const parts = pathname.split("/");
    const saPath = parts[1] || "sa";
    router.replace(`/${saPath}/subscriptions`);
  }, []);

  return null;
}
