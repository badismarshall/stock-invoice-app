"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StatsFiltersProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function StatsFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: StatsFiltersProps) {
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [endDateOpen, setEndDateOpen] = React.useState(false);

  const setPreset = (preset: "today" | "week" | "month" | "year" | "all") => {
    const today = new Date();
    // Normalize to start of day
    today.setHours(0, 0, 0, 0);
    
    let start: Date | undefined;
    let end: Date | undefined;

    switch (preset) {
      case "today":
        start = new Date(today);
        end = new Date(today);
        break;
      case "week":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "all":
        start = undefined;
        end = undefined;
        break;
    }

    // Force update by creating new instances
    onStartDateChange(start ? new Date(start) : undefined);
    onEndDateChange(end ? new Date(end) : undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "PPP", { locale: fr })
              ) : (
                <span>Date de début</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onStartDateChange(date);
                setStartDateOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">à</span>

        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "PPP", { locale: fr })
              ) : (
                <span>Date de fin</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                onEndDateChange(date);
                setEndDateOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset("today")}
        >
          Aujourd'hui
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset("week")}
        >
          7 jours
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset("month")}
        >
          Ce mois
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset("year")}
        >
          Cette année
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset("all")}
        >
          Tout
        </Button>
      </div>
    </div>
  );
}

