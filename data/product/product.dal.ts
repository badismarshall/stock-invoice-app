import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import db from "@/db";
import { product, category } from "@/db/schema";
import type { GetProductsSchema } from "@/app/(root)/dashboard/products/_lib/validation";
import type { ProductDTO } from "./product.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getProductById = async (id: string) => {
  try {
    const result = await db
      .select({
        product: product,
        category: {
          id: category.id,
          name: category.name,
        },
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(eq(product.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    return {
      id: item.product.id,
      code: item.product.code,
      name: item.product.name,
      description: item.product.description,
      categoryId: item.product.categoryId,
      categoryName: item.category?.name || null,
      unitOfMeasure: item.product.unitOfMeasure,
      purchasePrice: item.product.purchasePrice,
      salePriceLocal: item.product.salePriceLocal,
      salePriceExport: item.product.salePriceExport,
      taxRate: item.product.taxRate,
      isActive: item.product.isActive ?? true,
      createdAt: item.product.createdAt,
      updatedAt: item.product.updatedAt,
    };
  } catch (error) {
    console.error("Error getting product by ID", error);
    return null;
  }
};

export const getProducts = async (input: GetProductsSchema): Promise<ProductDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: product,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by name or code
          input.name || input.code
            ? or(
                input.name ? ilike(product.name, `%${input.name}%`) : undefined,
                input.code ? ilike(product.code, `%${input.code}%`) : undefined,
              )
            : undefined,
          // Filter by category
          input.categoryId && input.categoryId.length > 0
            ? inArray(product.categoryId, input.categoryId)
            : undefined,
          // Filter by isActive
          input.isActive && input.isActive.length > 0
            ? inArray(product.isActive, input.isActive)
            : undefined,
          // Filter by createdAt date range
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      product.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      product.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[1]);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
        );

    // Map sort IDs to actual product table columns
    const columnMap = {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      unitOfMeasure: product.unitOfMeasure,
      purchasePrice: product.purchasePrice,
      salePriceLocal: product.salePriceLocal,
      salePriceExport: product.salePriceExport,
      taxRate: product.taxRate,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(product.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select({
          product: product,
          category: {
            id: category.id,
            name: category.name,
          },
        })
        .from(product)
        .leftJoin(category, eq(product.categoryId, category.id))
        .limit(input.perPage)
        .offset(offset)
        .where(where)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(product)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      products: data.map((item) => ({
        id: item.product.id,
        code: item.product.code,
        name: item.product.name,
        description: item.product.description,
        categoryId: item.product.categoryId,
        categoryName: item.category?.name || null,
        unitOfMeasure: item.product.unitOfMeasure,
        purchasePrice: item.product.purchasePrice,
        salePriceLocal: item.product.salePriceLocal,
        salePriceExport: item.product.salePriceExport,
        taxRate: item.product.taxRate,
        isActive: item.product.isActive ?? true,
        createdAt: item.product.createdAt,
        updatedAt: item.product.updatedAt,
      })),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting products", error);
    return {
      products: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
};

