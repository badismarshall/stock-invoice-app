"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getPartners as getPartnersDAL } from "@/data/partner/partner.dal";
import type { GetPartnersSchema } from "./validation";

export async function getPartners(input: GetPartnersSchema & { type: "client" | "fournisseur" }) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("partners");

  try {
    const result = await getPartnersDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.partners, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getPartners service", error);
    return { data: [], pageCount: 0 };
  }
}

