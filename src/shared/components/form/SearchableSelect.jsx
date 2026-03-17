import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

export const SearchableSelect = ({
  items = [],
  value,
  onChange,
  placeholder = "Pilih...",
  emptyText = "Data tidak ditemukan",
  disabled = false,
  error = false,
  allowClear = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedItem = React.useMemo(
    () => items.find((item) => String(item.value) === String(value)),
    [value, items],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedItem && "text-muted-foreground",
            error && "border-destructive text-destructive",
          )}
        >
          <span className="truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
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
              {allowClear && selectedItem && (
                <CommandItem
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="font-medium text-muted-foreground italic"
                >
                  Kosongkan pilihan
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // CommandItem filters by textValue/value prop
                  disabled={item.disabled}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        String(value) === String(item.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
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
