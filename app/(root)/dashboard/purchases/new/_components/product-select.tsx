"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getActiveProductsPaginated } from "../../_lib/actions";

interface ProductSelectProps {
  value?: string;
  onValueChange: (value: string, product?: ProductData) => void;
  disabled?: boolean;
  placeholder?: string;
}

type ProductData = {
  id: string;
  name: string;
  code: string;
  purchasePrice: string | null;
  salePriceLocal: string | null;
  salePriceExport: string | null;
  taxRate: string | null;
  unitOfMeasure: string;
};

export function ProductSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Sélectionner un produit...",
}: ProductSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<ProductData[]>([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [selectedProductData, setSelectedProductData] = React.useState<ProductData | null>(null);
  const commandListRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const limit = 20;

  // Fetch products function
  const fetchProducts = React.useCallback(
    async (pageNum: number, searchTerm: string, append: boolean = false) => {
      setLoading(true);
      try {
        const result = await getActiveProductsPaginated({
          page: pageNum,
          limit,
          search: searchTerm || undefined,
        });

        if (result.error) {
          console.error("Error fetching products:", result.error);
          return;
        }

        if (result.data) {
          if (append) {
            setProducts((prev) => [...prev, ...result.data]);
          } else {
            setProducts(result.data);
          }

          setHasMore(result.pagination.page < result.pagination.totalPages);
          setTotal(result.pagination.total);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load and when search changes
  React.useEffect(() => {
    if (open) {
      // Reset page when search changes
      setPage(1);
      setHasMore(true);
      
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchProducts(1, search, false);
      }, 300);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [open, search, fetchProducts]);

  // Handle scroll for lazy loading
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      // Load more when scrolled near bottom (50px threshold)
      if (scrollBottom < 50 && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, search, true);
      }
    },
    [hasMore, loading, page, search, fetchProducts]
  );

  // Reset when popover closes (but keep selectedProductData)
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setPage(1);
      setProducts([]);
      setHasMore(true);
    }
  }, [open]);

  // Update cached product data when found in list
  React.useEffect(() => {
    if (value) {
      const fromList = products.find((p) => p.id === value);
      if (fromList && (!selectedProductData || selectedProductData.id !== fromList.id)) {
        setSelectedProductData(fromList);
      }
    }
  }, [products, value, selectedProductData]);

  // Find selected product for display (prefer from current list, fallback to cached data)
  const selectedProduct = React.useMemo(() => {
    const fromList = products.find((p) => p.id === value);
    if (fromList) {
      return fromList;
    }
    // Return cached data if available and matches value
    return selectedProductData && selectedProductData.id === value ? selectedProductData : null;
  }, [products, value, selectedProductData]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct
            ? `${selectedProduct.name} (${selectedProduct.code})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un produit (nom ou code)..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            ref={commandListRef}
            onScroll={handleScroll}
            className="max-h-[300px] overflow-y-auto"
          >
            <CommandEmpty>
              {loading ? "Chargement..." : "Aucun produit trouvé."}
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    const newValue = product.id === value ? "" : product.id;
                    if (newValue) {
                      setSelectedProductData(product);
                      onValueChange(newValue, product);
                    } else {
                      setSelectedProductData(null);
                      onValueChange("", undefined);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Code: {product.code}
                    </span>
                  </div>
                </CommandItem>
              ))}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Chargement...
                  </span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  {total} produit{total > 1 ? "s" : ""} au total
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

