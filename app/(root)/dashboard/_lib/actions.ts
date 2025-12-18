"use server";

import db from "@/db";
import { invoice, payment, stockCurrent, product, partner } from "@/db/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats() {
  try {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    const startOfLastMonth = startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    const endOfLastMonth = endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1));

    // Get sales invoices stats (current month)
    const salesStatsCurrent = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
        count: sql<string>`COUNT(*)`,
        paidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
        unpaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'unpaid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.invoiceType, "sale_invoice"),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startOfCurrentMonth.toISOString().split('T')[0]),
          lte(invoice.invoiceDate, endOfCurrentMonth.toISOString().split('T')[0])
        )
      )
      .execute()
      .then((res) => res[0] || { totalAmount: "0", count: "0", paidAmount: "0", unpaidAmount: "0" });

    // Get sales invoices stats (last month)
    const salesStatsLast = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.invoiceType, "sale_invoice"),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startOfLastMonth.toISOString().split('T')[0]),
          lte(invoice.invoiceDate, endOfLastMonth.toISOString().split('T')[0])
        )
      )
      .execute()
      .then((res) => res[0] || { totalAmount: "0" });

    // Get purchase invoices stats (current month)
    const purchaseStatsCurrent = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
        count: sql<string>`COUNT(*)`,
        paidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
        unpaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'unpaid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.invoiceType, "purchase"),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startOfCurrentMonth.toISOString().split('T')[0]),
          lte(invoice.invoiceDate, endOfCurrentMonth.toISOString().split('T')[0])
        )
      )
      .execute()
      .then((res) => res[0] || { totalAmount: "0", count: "0", paidAmount: "0", unpaidAmount: "0" });

    // Get unpaid invoices count
    const unpaidInvoices = await db
      .select({
        count: sql<string>`COUNT(*)`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.status, "active"),
          eq(invoice.paymentStatus, "unpaid")
        )
      )
      .execute()
      .then((res) => res[0] || { count: "0", totalAmount: "0" });

    // Get partially paid invoices count
    const partiallyPaidInvoices = await db
      .select({
        count: sql<string>`COUNT(*)`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.status, "active"),
          eq(invoice.paymentStatus, "partially_paid")
        )
      )
      .execute()
      .then((res) => res[0] || { count: "0", totalAmount: "0" });

    // Get total payments (current month)
    const paymentsCurrent = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${payment.amount} AS NUMERIC)), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(payment)
      .where(
        and(
          gte(payment.paymentDate, startOfCurrentMonth.toISOString().split('T')[0]),
          lte(payment.paymentDate, endOfCurrentMonth.toISOString().split('T')[0])
        )
      )
      .execute()
      .then((res) => res[0] || { totalAmount: "0", count: "0" });

    // Get stock stats
    const stockStats = await db
      .select({
        totalValue: sql<string>`COALESCE(SUM(CAST(${stockCurrent.quantityAvailable} AS NUMERIC) * CAST(${stockCurrent.averageCost} AS NUMERIC)), 0)`,
        totalProducts: sql<string>`COUNT(*)`,
        lowStockCount: sql<string>`COUNT(CASE WHEN CAST(${stockCurrent.quantityAvailable} AS NUMERIC) <= 0 THEN 1 END)`,
      })
      .from(stockCurrent)
      .execute()
      .then((res) => res[0] || { totalValue: "0", totalProducts: "0", lowStockCount: "0" });

    // Get total products
    const totalProducts = await db
      .select({
        count: sql<string>`COUNT(*)`,
      })
      .from(product)
      .where(eq(product.isActive, true))
      .execute()
      .then((res) => res[0]?.count || "0");

    // Get total clients
    const totalClients = await db
      .select({
        count: sql<string>`COUNT(*)`,
      })
      .from(partner)
      .where(eq(partner.type, "client"))
      .execute()
      .then((res) => res[0]?.count || "0");

    // Get total suppliers
    const totalSuppliers = await db
      .select({
        count: sql<string>`COUNT(*)`,
      })
      .from(partner)
      .where(eq(partner.type, "supplier"))
      .execute()
      .then((res) => res[0]?.count || "0");

    // Calculate sales growth
    const salesCurrent = parseFloat(salesStatsCurrent.totalAmount);
    const salesLast = parseFloat(salesStatsLast.totalAmount);
    const salesGrowth = salesLast > 0 ? ((salesCurrent - salesLast) / salesLast) * 100 : 0;

    return {
      sales: {
        totalAmount: parseFloat(salesStatsCurrent.totalAmount),
        count: parseInt(salesStatsCurrent.count),
        paidAmount: parseFloat(salesStatsCurrent.paidAmount),
        unpaidAmount: parseFloat(salesStatsCurrent.unpaidAmount),
        growth: salesGrowth,
      },
      purchases: {
        totalAmount: parseFloat(purchaseStatsCurrent.totalAmount),
        count: parseInt(purchaseStatsCurrent.count),
        paidAmount: parseFloat(purchaseStatsCurrent.paidAmount),
        unpaidAmount: parseFloat(purchaseStatsCurrent.unpaidAmount),
      },
      unpaidInvoices: {
        count: parseInt(unpaidInvoices.count),
        totalAmount: parseFloat(unpaidInvoices.totalAmount),
      },
      partiallyPaidInvoices: {
        count: parseInt(partiallyPaidInvoices.count),
        totalAmount: parseFloat(partiallyPaidInvoices.totalAmount),
      },
      payments: {
        totalAmount: parseFloat(paymentsCurrent.totalAmount),
        count: parseInt(paymentsCurrent.count),
      },
      stock: {
        totalValue: parseFloat(stockStats.totalValue),
        totalProducts: parseInt(stockStats.totalProducts),
        lowStockCount: parseInt(stockStats.lowStockCount),
      },
      products: {
        total: parseInt(totalProducts),
      },
      partners: {
        clients: parseInt(totalClients),
        suppliers: parseInt(totalSuppliers),
      },
    };
  } catch (error) {
    console.error("Error getting dashboard stats", error);
    return {
      sales: { totalAmount: 0, count: 0, paidAmount: 0, unpaidAmount: 0, growth: 0 },
      purchases: { totalAmount: 0, count: 0, paidAmount: 0, unpaidAmount: 0 },
      unpaidInvoices: { count: 0, totalAmount: 0 },
      partiallyPaidInvoices: { count: 0, totalAmount: 0 },
      payments: { totalAmount: 0, count: 0 },
      stock: { totalValue: 0, totalProducts: 0, lowStockCount: 0 },
      products: { total: 0 },
      partners: { clients: 0, suppliers: 0 },
    };
  }
}

