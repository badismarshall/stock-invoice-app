"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDeliveryNoteCancellations as getDeliveryNoteCancellationsDAL } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dal";
import type { GetDeliveryNoteCancellationsSchema } from "./validation";

export async function getDeliveryNoteCancellations(input: GetDeliveryNoteCancellationsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("deliveryNoteCancellations");

  try {
    const dalInput = {
      ...input,
      filterFlag: input.filterFlag ?? undefined,
      search: input.search || undefined,
      cancellationNumber: input.cancellationNumber || undefined,
      clientId: input.clientId && input.clientId.length > 0 ? input.clientId : undefined,
      cancellationDate: input.cancellationDate && input.cancellationDate.length > 0 ? input.cancellationDate : undefined,
      createdAt: input.createdAt && input.createdAt.length > 0 ? input.createdAt : undefined,
    };
    
    const result = await getDeliveryNoteCancellationsDAL(dalInput);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.cancellations, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getDeliveryNoteCancellations service", error);
    return { data: [], pageCount: 0 };
  }
}

