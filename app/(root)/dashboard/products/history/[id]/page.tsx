import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductSalesHistoryContent } from "./_components/product-sales-history-content";
import { getProductById } from "../../_lib/actions";

export const metadata: Metadata = {
  title: "Historique des ventes",
  description: "Historique des ventes d'un produit",
};

interface ProductSalesHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductSalesHistoryPage({
  params,
}: ProductSalesHistoryPageProps) {
  const { id } = await params;
  
  // Verify product exists
  const productResult = await getProductById({ id });
  if (productResult.error || !productResult.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <ProductSalesHistoryContent productId={id} />
    </div>
  );
}

