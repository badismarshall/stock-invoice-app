import { CommandIcon, FileSpreadsheetIcon } from "lucide-react";

export type FlagConfig = typeof flagConfig;

export const flagConfig = {
  featureFlags: [
    {
      label: "Filtres avancés",
      value: "advancedFilters" as const,
      icon: FileSpreadsheetIcon,
      tooltipTitle: "Filtres avancés",
      tooltipDescription: "Filtres avancés type Airtable pour filtrer les lignes.",
    },
    {
      label: "Filtres commande",
      value: "commandFilters" as const,
      icon: CommandIcon,
      tooltipTitle: "Puce de filtre par commande",
      tooltipDescription: "Palette de commande type Linear pour filtrer les lignes.",
    },
  ],
};