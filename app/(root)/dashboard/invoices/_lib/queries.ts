import { cacheLife, cacheTag } from "@/lib/cache";
import { getInvoices } from "@/data/invoice/invoice.dal";
import type { GetInvoicesSchema } from "./validation";

export const getInvoicesQuery = cacheLife(
  async (input: GetInvoicesSchema) => {
    return getInvoices(input);
  },
  {
    revalidate: 60,
    tags: [cacheTag("invoices")],
  }
);

