import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createSingleBlogPost,
  deleteSingleBlogPost,
  readBlogPosts,
  sanitizeBlogPayload,
  updateSingleBlogPost
} from "../../../lib/blog.js";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server.js";
import { ownerFromRequest } from "../../../lib/adminAuth.js";

function forbidden() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function success(payload = {}, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status });
}

function failure(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

function revalidateBlogPaths(slug = "") {
  ["/blog", "/fa/blog", slug ? `/blog/${slug}` : "", slug ? `/fa/blog/${slug}` : ""]
    .filter(Boolean)
    .forEach((path) => revalidatePath(path));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !ownerFromRequest(request)) return forbidden();

  try {
    const items = await readBlogPosts({
      allowFallback: !adminMode,
      publishedOnly: !adminMode
    });
    return success({ items });
  } catch (error) {
    console.error("[api/blog:GET]", error);
    return failure(error.message || "Could not fetch blog posts.", 500);
  }
}

export async function POST(request) {
  if (!ownerFromRequest(request)) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = sanitizeBlogPayload(await request.json(), { includeId: false });
    console.log("[api/blog]", { table: "blog_posts", action: "create", payloadKeys: Object.keys(payload || {}) });
    const saved = await createSingleBlogPost(payload);
    revalidateBlogPaths(saved.slug);
    return success({ item: saved });
  } catch (error) {
    console.error("[api/blog:POST]", error);
    return failure(error.message || "Could not save blog post.", 500);
  }
}

export async function PUT(request) {
  if (!ownerFromRequest(request)) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = sanitizeBlogPayload(await request.json(), { includeId: true });
    console.log("[api/blog]", { table: "blog_posts", action: "update", payloadKeys: Object.keys(payload || {}) });
    const saved = await updateSingleBlogPost(payload);
    revalidateBlogPaths(saved.slug);
    return success({ item: saved });
  } catch (error) {
    console.error("[api/blog:PUT]", error);
    return failure(error.message || "Could not update blog post.", 500);
  }
}

export async function DELETE(request) {
  if (!ownerFromRequest(request)) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug") || "";
    if (!id) return failure("Blog post id is required.", 400);

    console.log("[api/blog]", { table: "blog_posts", action: "delete", payloadKeys: ["id"] });
    await deleteSingleBlogPost(id);
    revalidateBlogPaths(slug);
    return success({ item: { id } });
  } catch (error) {
    console.error("[api/blog:DELETE]", error);
    return failure(error.message || "Could not delete blog post.", 500);
  }
}
