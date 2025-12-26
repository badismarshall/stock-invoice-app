import "server-only";

import { getRoles } from "../_lib/actions";
import type { SearchParams } from "@/types";

export async function getRolesQuery(input: SearchParams) {
  try {
    const result = await getRoles();
    if (result.error) {
      return {
        data: [],
        pageCount: 0,
        error: result.error,
      };
    }

    const roles = result.data || [];
    
    // Simple pagination (can be enhanced later)
    const page = Number(input.page) || 1;
    const perPage = Number(input.perPage) || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedRoles = roles.slice(start, end);
    const pageCount = Math.ceil(roles.length / perPage);

    return {
      data: paginatedRoles,
      pageCount,
      error: null,
    };
  } catch (error) {
    console.error("Error in getRolesQuery", error);
    return {
      data: [],
      pageCount: 0,
      error: "Erreur lors de la récupération des rôles",
    };
  }
}

