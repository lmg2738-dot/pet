import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { listPets, createPet } from "@/lib/db/store";
import { getOwnerIdFromRequest, OWNER_COOKIE } from "@/lib/session";
import { createPetSchema } from "@/lib/validations";
import type { Pet } from "@/types/database";

export async function GET(request: NextRequest) {
  const ownerId = getOwnerIdFromRequest(request);
  const pets = await listPets(ownerId);
  return jsonSuccess({ pets });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = createPetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const ownerId = getOwnerIdFromRequest(request);

  try {
    const pet = await createPet(ownerId, parsed.data);
    const response = jsonSuccess({ pet: pet as Pet }, 201);
    response.cookies.set(OWNER_COOKIE, ownerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create pet.";
    return jsonError(message, 500);
  }
}
