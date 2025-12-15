"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDeliveryNotes as getDeliveryNotesDAL } from "@/data/delivery-note/delivery-note.dal";
import type { GetDeliveryNotesSchema } from "./validation";

export async function getDeliveryNotes(input: GetDeliveryNotesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("deliveryNotes");

  try {
    const result = await getDeliveryNotesDAL({
      ...input,
      filterFlag: input.filterFlag ?? undefined,
    });
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


