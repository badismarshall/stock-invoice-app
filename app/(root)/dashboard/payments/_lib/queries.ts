"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getPayments as getPaymentsDAL } from "@/data/payment/payment.dal";
import type { GetPaymentsSchema } from "./validation";

// Valid enum values
const validPaymentMethods = ["cash", "check", "transfer", "other"] as const;
type ValidPaymentMethod = typeof validPaymentMethods[number];

export async function getPayments(input: GetPaymentsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("payments");

  try {
    // Convert enum arrays from string[] to the expected types
    const paymentMethod = Array.isArray(input.paymentMethod)
      ? input.paymentMethod.filter((method): method is ValidPaymentMethod => 
          validPaymentMethods.includes(method as ValidPaymentMethod)
        )
      : [];

    // Convert date arrays from number[] (timestamps) to Date[]
    const paymentDate = Array.isArray(input.paymentDate)
      ? input.paymentDate.map((ts) => new Date(ts))
      : [];

    const createdAt = Array.isArray(input.createdAt)
      ? input.createdAt.map((ts) => new Date(ts))
      : [];

    const result = await getPaymentsDAL({
      ...input,
      paymentMethod,
      paymentDate,
      createdAt,
      filterFlag: input.filterFlag ?? undefined,
    });
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.payments, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getPayments service", error);
    return { data: [], pageCount: 0 };
  }
}

