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
  nif?: string;
  rc?: string;
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
      nif: input.nif || null,
      rc: input.rc || null,
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
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

