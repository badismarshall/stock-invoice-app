"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetDeliveryNotesSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getDeliveryNotes as getDeliveryNotesDAL } from "@/data/delivery-note/delivery-note.dal";
import { inArray } from "drizzle-orm";
import { deliveryNote } from "@/db/schema";

/**
 * Get delivery notes by IDs for export
 */
export async function getDeliveryNotesByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Get all delivery notes (we'll filter by IDs in memory)
    // Use a large perPage to get all notes, then filter
    const result = await getDeliveryNotesDAL({
      page: 1,
      perPage: 10000,
      sort: [],
      filters: [],
      noteType: ["export"],
      status: [],
      clientId: [],
      noteDate: [],
      createdAt: [],
      noteNumber: "",
      search: "",
      filterFlag: undefined,
      joinOperator: "and",
    });

    // Filter by IDs
    const notes = result.deliveryNotes.filter((note) => input.ids.includes(note.id));

    return {
      data: notes,
      error: null,
    };
  } catch (err) {
    console.error("Error getting delivery notes by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered delivery notes for export based on table filters
 */
export async function getFilteredDeliveryNotesForExport(input: GetDeliveryNotesSchema) {
  try {
    const validFilters = getValidFilters(input.filters);

    // Convert date arrays from number[] (timestamps) to Date[] for noteDate
    // Note: noteDate is a date type in DB, not timestamp, so we need to handle it differently
    // But for the DAL, we pass the number[] as is and let it handle the conversion

    // Get all delivery notes matching filters (use a large perPage to get all)
    const result = await getDeliveryNotesDAL({
      ...input,
      perPage: 10000, // Large number to get all matching notes
      filters: validFilters,
      filterFlag: input.filterFlag ?? undefined,
      // Ensure we only get export delivery notes
      noteType: input.noteType && input.noteType.length > 0
        ? input.noteType.filter(type => type === "export")
        : ["export"],
    });

    return {
      data: result.deliveryNotes,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered delivery notes for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

