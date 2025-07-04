"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  maxDisplayItems?: number;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select item...",
  searchPlaceholder = "Search items...",
  emptyText = "No items found.",
  className,
  maxDisplayItems = 50,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!debouncedSearch) {
      // If no search, show first maxDisplayItems items
      return options.slice(0, maxDisplayItems);
    }

    const searchLower = debouncedSearch.toLowerCase();
    const filtered = options.filter((option) => {
      const haystack = `${option.label} ${option.keywords || ""}`.toLowerCase();
      return haystack.includes(searchLower);
    });

    // Limit results to maxDisplayItems
    return filtered.slice(0, maxDisplayItems);
  }, [options, debouncedSearch, maxDisplayItems]);

  // Custom filter function for cmdk - always return 1 to let our custom filtering handle it
  const filter = React.useCallback(() => 1, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command filter={filter}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {debouncedSearch ? emptyText : "Type to search..."}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue(""); // Clear search when item is selected
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length === maxDisplayItems && debouncedSearch && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t">
                Showing first {maxDisplayItems} results. Refine your search for
                more.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
