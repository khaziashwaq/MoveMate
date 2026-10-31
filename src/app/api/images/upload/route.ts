import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum: 5MB" },
      { status: 400 }
    );
  }

  // Generate unique path
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : file.type === "image/avif" ? "avif" : "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${user.id}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from("listings")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listings").getPublicUrl(storagePath);

  return NextResponse.json({
    url: publicUrl,
    storagePath,
    sizeBytes: file.size,
  });
}
