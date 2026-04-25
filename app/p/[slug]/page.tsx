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
  const image = session?.og_image || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function CustomerPage({ params }: { params: { slug: string } }) {
  return <CustomerPageClient slug={params.slug} />;
}
