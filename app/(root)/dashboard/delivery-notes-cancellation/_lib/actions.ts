"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";

// Placeholder for future actions if needed
export async function placeholderAction() {
  try {
    updateTag("deliveryNoteCancellations");
    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error in placeholder action", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

