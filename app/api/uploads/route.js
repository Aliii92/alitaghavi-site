import { NextResponse } from "next/server";
import { ownerFromRequest } from "../../../lib/adminAuth";
import { hasSupabaseServerConfig, supabaseUploadPublicFile } from "../../../lib/supabase-server.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function safeName(value) {
  return String(value || "property-image")
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extensionFor(file) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request) {
  try {
    if (!ownerFromRequest(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { success: false, error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and optionally SUPABASE_STORAGE_BUCKET." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const propertyId = formData.get("propertyId");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "Missing image file" }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPG, PNG, WEBP images and PDF documents are allowed" }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ success:false,error:"Choose a file smaller than 4 MB." },{status:413});

    const filename = `${safeName(propertyId)}-${Date.now()}.${extensionFor(file)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    console.log("[api/uploads]", {
      action: "upload",
      table: "storage",
      owner: ownerFromRequest(request),
      payloadKeys: ["propertyId", "image"]
    });
    const uploaded = await supabaseUploadPublicFile({
      objectPath: filename,
      body: bytes,
      contentType: file.type
    });

    return NextResponse.json({
      success: true,
      item: {
        image_url: uploaded.image_url,
        bucket: uploaded.bucket,
        path: uploaded.path
      },
      image_url: uploaded.image_url,
      bucket: uploaded.bucket,
      path: uploaded.path
    });
  } catch (error) {
    console.error("[api/uploads:POST]", error);
    return NextResponse.json({ success: false, error: error.message || "Image upload failed." }, { status: 500 });
  }
}

