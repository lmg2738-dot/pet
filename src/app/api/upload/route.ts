import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getPet } from "@/lib/db/store";
import { getOwnerIdFromRequest } from "@/lib/session";
import {
  savePetImage,
  toPublicImageUrl,
  validateImageFile,
} from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const petId = formData.get("pet_id");

  if (!(file instanceof File)) {
    return jsonError("File is required.");
  }

  if (typeof petId !== "string" || !/^[0-9a-f-]{36}$/i.test(petId)) {
    return jsonError("Valid pet_id is required.");
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return jsonError(validationError);
  }

  const ownerId = getOwnerIdFromRequest(request);
  const pet = await getPet(ownerId, petId);

  if (!pet) {
    return jsonError("Pet not found.", 404);
  }

  try {
    const { relativePath } = await savePetImage(ownerId, petId, file);
    const image_url = toPublicImageUrl(relativePath, request);

    return jsonSuccess({
      image_url,
      path: relativePath,
    });
  } catch {
    return jsonError("Failed to upload image.", 500);
  }
}
