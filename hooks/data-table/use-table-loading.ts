"use client";

import * as React from "react";
import { useTransition } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook to detect when table data is loading (page changes, sorting, filtering)
 * Returns loading state and transition function for use with useDataTable
 */
export function useTableLoading() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = React.useState(false);
  const previousParamsRef = React.useRef<string>("");

  // Track URL parameter changes to detect navigation
  React.useEffect(() => {
    const currentParams = searchParams.toString();
    if (previousParamsRef.current && previousParamsRef.current !== currentParams) {
      // Parameters changed (page, sort, filters, etc.)
      setIsLoading(true);
    }
    previousParamsRef.current = currentParams;
  }, [searchParams]);

  // Reset loading when data changes (handled by parent component)
  const resetLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const showLoading = isPending || isLoading;

  return {
    showLoading,
    isLoading,
    isPending,
    startTransition,
    resetLoading,
  };
}

