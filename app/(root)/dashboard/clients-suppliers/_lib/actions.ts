"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { partner } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function addPartner(input: {
  name: string;
  contact?: string; // Kept for backward compatibility, though not used in form
  phone?: string;
  email?: string;
  address?: string;
  credit?: string;
  nafApe?: string;
  rcsRm?: string;
  eori?: string;
  tvaNumber?: string;
  type: "client" | "fournisseur";
}) {
  try {
    const id = generateId();
    const creditValue = input.credit ? input.credit : "0";

    await db.insert(partner).values({
      id,
      name: input.name,
      contact: input.contact || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      credit: creditValue,
      nafApe: input.nafApe || null,
      rcsRm: input.rcsRm || null,
      eori: input.eori || null,
      tvaNumber: input.tvaNumber || null,
      type: input.type,
    });

    updateTag("partners");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding partner", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deletePartner(input: { id: string }) {
  try {
    await db.delete(partner).where(eq(partner.id, input.id));

    updateTag("partners");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting partner", err);
    console.error("Error details:", {
      code: (err as any)?.code,
      message: err instanceof Error ? err.message : String(err),
      name: (err as any)?.name,
      severity: (err as any)?.severity,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table,
      fullError: err,
    });
    
    // Check if error is a foreign key constraint violation
    // PostgreSQL error code 23503 = foreign key constraint violation
    const errorCode = (err as any)?.code;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorString = String(err).toLowerCase();
    const fullErrorString = JSON.stringify(err).toLowerCase();
    const errorDetail = (err as any)?.detail || "";
    const errorConstraint = (err as any)?.constraint || "";
    
    // Check for PostgreSQL foreign key constraint violation (error code 23503)
    if (errorCode === "23503" || errorString.includes("23503")) {
      // Check if the error is specifically about purchase_order (suppliers)
      const constraintLower = errorConstraint.toLowerCase();
      const detailLower = errorDetail.toLowerCase();
      if (
        errorString.includes("purchase_order") || 
        errorString.includes("purchase order") || 
        fullErrorString.includes("purchase_order") ||
        constraintLower.includes("purchase_order") ||
        detailLower.includes("purchase_order")
      ) {
        return {
          data: null,
          error: "Impossible de supprimer ce fournisseur car il est lié à un ou plusieurs achats.",
        };
      }
      
      return {
        data: null,
        error: "Impossible de supprimer ce partenaire car il est lié à des factures, paiements ou bons de livraison.",
      };
    }
    
    // Fallback: check error message/string for constraint keywords
    const isForeignKeyError = 
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key constraint") ||
      errorString.includes("purchase_order") ||
      errorString.includes("restrict") ||
      errorConstraint.includes("purchase_order") ||
      errorDetail.includes("purchase_order");
    
    if (isForeignKeyError) {
      const constraintLower = errorConstraint.toLowerCase();
      const detailLower = errorDetail.toLowerCase();
      if (
        errorString.includes("purchase_order") || 
        errorString.includes("purchase order") ||
        constraintLower.includes("purchase_order") ||
        detailLower.includes("purchase_order")
      ) {
        return {
          data: null,
          error: "Impossible de supprimer ce fournisseur car il est lié à un ou plusieurs achats.",
        };
      }
      
      return {
        data: null,
        error: "Impossible de supprimer ce partenaire car il est lié à des factures, paiements ou bons de livraison.",
      };
    }

    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deletePartners(input: { ids: string[] }) {
  try {
    await db.delete(partner).where(inArray(partner.id, input.ids));

    updateTag("partners");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting partners", err);
    console.error("Error details:", {
      code: (err as any)?.code,
      message: err instanceof Error ? err.message : String(err),
      name: (err as any)?.name,
      severity: (err as any)?.severity,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table,
      fullError: err,
    });
    
    // Check if error is a foreign key constraint violation
    // PostgreSQL error code 23503 = foreign key constraint violation
    const errorCode = (err as any)?.code;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorString = String(err).toLowerCase();
    const fullErrorString = JSON.stringify(err).toLowerCase();
    const errorDetail = (err as any)?.detail || "";
    const errorConstraint = (err as any)?.constraint || "";
    
    // Check for PostgreSQL foreign key constraint violation (error code 23503)
    if (errorCode === "23503" || errorString.includes("23503")) {
      // Check if the error is specifically about purchase_order (suppliers)
      const constraintLower = errorConstraint.toLowerCase();
      const detailLower = errorDetail.toLowerCase();
      if (
        errorString.includes("purchase_order") || 
        errorString.includes("purchase order") || 
        fullErrorString.includes("purchase_order") ||
        constraintLower.includes("purchase_order") ||
        detailLower.includes("purchase_order")
      ) {
        return {
          data: null,
          error: "Impossible de supprimer ce(s) fournisseur(s) car il(s) est(sont) lié(s) à un ou plusieurs achats.",
        };
      }
      
      return {
        data: null,
        error: "Impossible de supprimer ce(s) partenaire(s) car il(s) est(sont) lié(s) à des factures, paiements ou bons de livraison.",
      };
    }
    
    // Fallback: check error message/string for constraint keywords
    const isForeignKeyError = 
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key constraint") ||
      errorString.includes("purchase_order") ||
      errorString.includes("restrict") ||
      errorConstraint.includes("purchase_order") ||
      errorDetail.includes("purchase_order");
    
    if (isForeignKeyError) {
      const constraintLower = errorConstraint.toLowerCase();
      const detailLower = errorDetail.toLowerCase();
      if (
        errorString.includes("purchase_order") || 
        errorString.includes("purchase order") ||
        constraintLower.includes("purchase_order") ||
        detailLower.includes("purchase_order")
      ) {
        return {
          data: null,
          error: "Impossible de supprimer ce(s) fournisseur(s) car il(s) est(sont) lié(s) à un ou plusieurs achats.",
        };
      }
      
      return {
        data: null,
        error: "Impossible de supprimer ce(s) partenaire(s) car il(s) est(sont) lié(s) à des factures, paiements ou bons de livraison.",
      };
    }

    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getPartnerById(input: { id: string }) {
  try {
    const result = await db
      .select()
      .from(partner)
      .where(eq(partner.id, input.id))
      .limit(1);

    if (result.length === 0) {
      return {
        data: null,
        error: "Partenaire non trouvé",
      };
    }

    return {
      data: result[0],
      error: null,
    };
  } catch (err) {
    console.error("Error getting partner by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updatePartner(input: {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit?: string;
  nafApe?: string;
  rcsRm?: string;
  eori?: string;
  tvaNumber?: string;
}) {
  try {
    const creditValue = input.credit ? input.credit : "0";

    await db
      .update(partner)
      .set({
        name: input.name,
        contact: input.contact || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        credit: creditValue,
        nafApe: input.nafApe || null,
        rcsRm: input.rcsRm || null,
        eori: input.eori || null,
        tvaNumber: input.tvaNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(partner.id, input.id));

    updateTag("partners");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating partner", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

