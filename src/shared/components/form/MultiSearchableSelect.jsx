import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Badge } from "@/shared/components/ui/badge";

export const MultiSearchableSelect = ({
  items = [],
  values = [],
  onChange,
  placeholder = "Pilih...",
  emptyText = "Data tidak ditemukan",
  disabled = false,
  error = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedItems = React.useMemo(
    () => items.filter((item) => values.includes(String(item.value))),
    [items, values],
  );

  const handleSelect = (currentValue) => {
    let newValues = [...values];
    if (newValues.includes(currentValue)) {
      newValues = newValues.filter((v) => v !== currentValue);
    } else {
      newValues.push(currentValue);
    }
    onChange(newValues);
  };

  const handleRemove = (valueToRemove, e) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== valueToRemove));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-10 py-1.5 font-normal",
            selectedItems.length === 0 && "text-muted-foreground",
            error && "border-destructive text-destructive",
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Badge
                  variant="secondary"
                  key={item.value}
                  className="rounded-sm px-1 font-normal flex items-center gap-1 shrink-0"
                >
                  {item.label}
                  <div
                    role="button"
                    tabIndex={0}
                    className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(String(item.value), e);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(String(item.value), e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  disabled={item.disabled}
                  onSelect={() => handleSelect(String(item.value))}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        values.includes(String(item.value))
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.hint && (
                        <span className="text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
