import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import { ImageUploadError, uploadTenantImage } from "@/services/image-upload.service";
import { imageUploadPurposeSchema } from "@/validators/image-upload";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);

    const formData = await request.formData();
    const file = formData.get("file");
    const purposeRaw = formData.get("purpose");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const purposeParsed = imageUploadPurposeSchema.safeParse(
      typeof purposeRaw === "string" ? purposeRaw : "general"
    );

    if (!purposeParsed.success) {
      return NextResponse.json({ error: "Invalid upload purpose" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await uploadTenantImage({
      tenantId: session.user.tenantId!,
      purpose: purposeParsed.data,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      body: buffer,
    });

    return NextResponse.json({ image: uploaded }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ImageUploadError) {
      const status =
        error.code === "INVALID_TYPE" || error.code === "FILE_TOO_LARGE" ? 400 : 500;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("[uploads/images POST]", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
