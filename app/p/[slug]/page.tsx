import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import CustomerPageClient from "./CustomerPageClient";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { data: session } = await supabase
    .from("sessions")
    .select("title, intro_text, og_title, og_description, og_image")
    .eq("slug", params.slug)
    .single();

  const title = session?.og_title || session?.title || "Preorder";
  const description = session?.og_description || session?.intro_text || "Halaman preorder Waitlistku";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const defaultImage = appUrl ? `${appUrl}/og-default.png` : undefined;
  const image = session?.og_image || defaultImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function CustomerPage({ params }: { params: { slug: string } }) {
  return <CustomerPageClient slug={params.slug} />;
}
