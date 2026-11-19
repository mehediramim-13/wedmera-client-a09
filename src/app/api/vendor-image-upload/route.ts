import { getAuth } from "@/lib/auth";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type ImageBBSuccess = {
  success?: boolean;
  data?: {
    url?: string;
  };
  error?: {
    message?: string;
  };
};

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return jsonError("Cross-origin uploads are not allowed.", 403);
      }
    } catch {
      return jsonError("Invalid request origin.", 403);
    }
  }

  const session = await getAuth().api.getSession({
    headers: request.headers,
  });
  if (!session?.user) {
    return jsonError("Please sign in to upload service images.", 401);
  }
  if (session.user.role !== "vendor") {
    return jsonError("Only vendors can upload service images.", 403);
  }

  const apiKey = process.env.IMAGEBB_API_KEY;
  if (!apiKey) {
    return jsonError("Image uploads are not configured on the server.", 503);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_IMAGE_SIZE + 64 * 1024) {
    return jsonError("Images must be 5 MB or smaller.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Choose a valid image file to upload.", 400);
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return jsonError("Choose an image file to upload.", 400);
  }
  if (!IMAGE_TYPES.has(image.type)) {
    return jsonError("Choose a JPEG, PNG, WebP, or GIF image.", 400);
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return jsonError("Images must be 5 MB or smaller.", 413);
  }

  const imageBBForm = new FormData();
  imageBBForm.append("image", image, image.name);
  const endpoint = new URL("https://api.imgbb.com/1/upload");
  endpoint.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: imageBBForm,
      cache: "no-store",
    });
  } catch {
    return jsonError("Could not reach ImageBB. Please try again.", 502);
  }

  const result = (await response.json().catch(() => null)) as
    | ImageBBSuccess
    | null;
  const imageUrl = result?.data?.url;
  let validImageUrl = false;
  if (imageUrl) {
    try {
      validImageUrl = new URL(imageUrl).protocol === "https:";
    } catch {
      validImageUrl = false;
    }
  }

  if (!response.ok || !result?.success || !imageUrl || !validImageUrl) {
    return jsonError("ImageBB could not save this image. Please try again.", 502);
  }

  return Response.json({ url: imageUrl });
}
