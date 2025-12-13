"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { category } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function addCategory(input: {
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const id = generateId();

    await db.insert(category).values({
      id,
      name: input.name,
      description: input.description || null,
      isActive: input.isActive ?? true,
    });

    updateTag("categories");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding category", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteCategory(input: { id: string }) {
  try {
    await db.delete(category).where(eq(category.id, input.id));

    updateTag("categories");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting category", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteCategories(input: { ids: string[] }) {
  try {
    await db.delete(category).where(inArray(category.id, input.ids));

    updateTag("categories");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting categories", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

