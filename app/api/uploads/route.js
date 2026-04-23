import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ownerFromRequest } from "../../../lib/adminAuth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeName(value) {
  return String(value || "property-image")
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request) {
  if (!ownerFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const propertyId = formData.get("propertyId");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WEBP images are allowed" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${safeName(propertyId)}-${Date.now()}.${extensionFor(file)}`;
  const filepath = path.join(uploadsDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filepath, bytes);

  return NextResponse.json({
    image_url: `/uploads/${filename}`
  });
}
