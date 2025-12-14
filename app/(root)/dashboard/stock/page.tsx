import { redirect } from "next/navigation"

interface StockPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StockPage(props: StockPageProps) {
  // Redirect to overview page by default
  redirect("/dashboard/stock/overview");
}

