import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (maximum 5MB)" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public directory exists
    const publicDir = join(process.cwd(), "public");
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Save/overwrite logo.png in public directory
    const logoPath = join(publicDir, "logo.png");
    await writeFile(logoPath, buffer);

    return NextResponse.json({
      success: true,
      message: "Logo mis à jour avec succès",
      url: "/logo.png",
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur lors de l'upload du logo",
      },
      { status: 500 }
    );
  }
}

