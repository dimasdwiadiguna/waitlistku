import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function GET(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("og_images")
    .select("id, url, name, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string | null)?.trim();

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WebP allowed" }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("og-images")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("og-images").getPublicUrl(fileName);
  const url = urlData.publicUrl;

  const { data, error: dbError } = await supabase
    .from("og_images")
    .insert({ url, name })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
