"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { unitOfMeasure } from "@/db/schema";
import { eq, inArray, and, ne } from "drizzle-orm";

export async function addUnitOfMeasure(input: {
  name: string;
  symbol: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    // Check if name or symbol already exists
    const existingUnit = await db
      .select({ id: unitOfMeasure.id })
      .from(unitOfMeasure)
      .where(
        and(
          eq(unitOfMeasure.name, input.name),
          eq(unitOfMeasure.symbol, input.symbol)
        )
      )
      .limit(1)
      .execute();

    if (existingUnit.length > 0) {
      return {
        data: null,
        error: `Une unité de mesure avec le nom "${input.name}" et le symbole "${input.symbol}" existe déjà.`,
      };
    }

    // Check if name already exists
    const existingName = await db
      .select({ id: unitOfMeasure.id })
      .from(unitOfMeasure)
      .where(eq(unitOfMeasure.name, input.name))
      .limit(1)
      .execute();

    if (existingName.length > 0) {
      return {
        data: null,
        error: `Une unité de mesure avec le nom "${input.name}" existe déjà.`,
      };
    }

    // Check if symbol already exists
    const existingSymbol = await db
      .select({ id: unitOfMeasure.id })
      .from(unitOfMeasure)
      .where(eq(unitOfMeasure.symbol, input.symbol))
      .limit(1)
      .execute();

    if (existingSymbol.length > 0) {
      return {
        data: null,
        error: `Une unité de mesure avec le symbole "${input.symbol}" existe déjà.`,
      };
    }

    const id = generateId();

    await db.insert(unitOfMeasure).values({
      id,
      name: input.name,
      symbol: input.symbol,
      description: input.description || null,
      isActive: input.isActive ?? true,
    });

    updateTag("unitsOfMeasure");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding unit of measure", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateUnitOfMeasure(input: {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    // Check if name or symbol already exists (excluding current unit)
    const existingName = await db
      .select({ id: unitOfMeasure.id })
      .from(unitOfMeasure)
      .where(
        and(
          eq(unitOfMeasure.name, input.name),
          ne(unitOfMeasure.id, input.id)
        )
      )
      .limit(1)
      .execute();

    if (existingName.length > 0) {
      return {
        data: null,
        error: `Une unité de mesure avec le nom "${input.name}" existe déjà.`,
      };
    }

    const existingSymbol = await db
      .select({ id: unitOfMeasure.id })
      .from(unitOfMeasure)
      .where(
        and(
          eq(unitOfMeasure.symbol, input.symbol),
          ne(unitOfMeasure.id, input.id)
        )
      )
      .limit(1)
      .execute();

    if (existingSymbol.length > 0) {
      return {
        data: null,
        error: `Une unité de mesure avec le symbole "${input.symbol}" existe déjà.`,
      };
    }

    await db
      .update(unitOfMeasure)
      .set({
        name: input.name,
        symbol: input.symbol,
        description: input.description || null,
        isActive: input.isActive ?? true,
      })
      .where(eq(unitOfMeasure.id, input.id));

    updateTag("unitsOfMeasure");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating unit of measure", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteUnitOfMeasure(input: { id: string }) {
  try {
    await db.delete(unitOfMeasure).where(eq(unitOfMeasure.id, input.id));

    updateTag("unitsOfMeasure");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting unit of measure", err);
    
    // Check if error is a foreign key constraint violation
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key constraint") ||
      errorMessage.includes("fk_product_unit_of_measure")
    ) {
      return {
        data: null,
        error: "Impossible de supprimer cette unité de mesure car elle est liée à un ou plusieurs produits.",
      };
    }

    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteUnitsOfMeasure(input: { ids: string[] }) {
  try {
    await db.delete(unitOfMeasure).where(inArray(unitOfMeasure.id, input.ids));

    updateTag("unitsOfMeasure");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting units of measure", err);
    
    // Check if error is a foreign key constraint violation
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key constraint") ||
      errorMessage.includes("fk_product_unit_of_measure")
    ) {
      return {
        data: null,
        error: "Impossible de supprimer cette unité de mesure car elle est liée à un ou plusieurs produits.",
      };
    }

    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getUnitOfMeasureByIdAction(input: { id: string }) {
  try {
    const { getUnitOfMeasureById } = await import("@/data/unit-of-measure/unit-of-measure.dal");
    const unit = await getUnitOfMeasureById(input.id);

    if (!unit) {
      return {
        data: null,
        error: "Unité de mesure non trouvée",
      };
    }

    return {
      data: unit,
      error: null,
    };
  } catch (err) {
    console.error("Error getting unit of measure by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

