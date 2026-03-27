import React, { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Filter, X } from "lucide-react";

/**
 * AdvancedFilterPopover — Filter client-side by loading, dumping, lot, status.
 * Extracts unique values from current dataset for dropdown options.
 *
 * @param {Array} data - Full dataset to extract filter options from
 * @param {Object} filters - Current filter values { loading, dumping, lot, status }
 * @param {Function} onFiltersChange - Callback when filters change
 * @param {boolean} showStatus - Whether to show status filter (default: true)
 */
export default function AdvancedFilterPopover({
  data = [],
  filters = {},
  onFiltersChange,
  showStatus = true,
}) {
  const [open, setOpen] = useState(false);

  // Extract unique values from data for dropdown options
  const options = useMemo(() => {
    const loadingSet = new Set();
    const dumpingSet = new Set();
    const lotSet = new Set();
    const statusSet = new Set();

    data.forEach((item) => {
      if (item.loading) loadingSet.add(item.loading);
      if (item.dumping) dumpingSet.add(item.dumping);
      if (item.lot) lotSet.add(item.lot);
      if (item.finish?.status) statusSet.add(item.finish.status);
    });

    return {
      loading: [...loadingSet].sort(),
      dumping: [...dumpingSet].sort(),
      lot: [...lotSet].sort(),
      status: [...statusSet].sort(),
    };
  }, [data]);

  const activeCount = Object.values(filters).filter(
    (v) => v && v !== "all"
  ).length;

  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearAll = () => {
    onFiltersChange({
      loading: "all",
      dumping: "all",
      lot: "all",
      status: "all",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 shrink-0 relative">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Filter Lanjutan</h4>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleClearAll}
            >
              <X className="w-3 h-3" /> Reset
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {showStatus && options.status.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {options.status.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {options.loading.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Asal (Loading)
              </label>
              <Select
                value={filters.loading || "all"}
                onValueChange={(v) => handleChange("loading", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Loading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Loading</SelectItem>
                  {options.loading.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {options.dumping.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tujuan (Dumping)
              </label>
              <Select
                value={filters.dumping || "all"}
                onValueChange={(v) => handleChange("dumping", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Dumping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Dumping</SelectItem>
                  {options.dumping.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {options.lot.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Lot
              </label>
              <Select
                value={filters.lot || "all"}
                onValueChange={(v) => handleChange("lot", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lot</SelectItem>
                  {options.lot.map((lot) => (
                    <SelectItem key={lot} value={lot}>
                      {lot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
