import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: image } = await supabase
    .from("og_images")
    .select("url")
    .eq("id", params.id)
    .single();

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Extract storage file path from URL
  const urlParts = image.url.split("/og-images/");
  if (urlParts.length === 2) {
    await supabase.storage.from("og-images").remove([urlParts[1]]);
  }

  await supabase.from("og_images").delete().eq("id", params.id);
  return NextResponse.json({ success: true });
}
