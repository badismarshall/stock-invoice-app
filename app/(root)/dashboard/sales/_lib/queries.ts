"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDeliveryNotes as getDeliveryNotesDAL } from "@/data/delivery-note/delivery-note.dal";
import type { GetDeliveryNotesSchema } from "./validation";

export async function getDeliveryNotes(input: GetDeliveryNotesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("deliveryNotes");

  try {
    // Ensure we always filter by local noteType, but preserve the search parameter
    const dalInput = {
      ...input,
      filterFlag: input.filterFlag ?? undefined,
      noteType: input.noteType && input.noteType.length > 0 
        ? input.noteType.filter(type => type === "local") // Only keep "local" if user selected it
        : ["local"], // Default to local only
      search: input.search || undefined, // Preserve search parameter
    };
    
    const result = await getDeliveryNotesDAL(dalInput);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.deliveryNotes, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getDeliveryNotes service", error);
    return { data: [], pageCount: 0 };
  }
}


