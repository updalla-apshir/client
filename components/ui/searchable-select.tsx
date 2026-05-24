"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableOption {
  value: string | number
  label: string
}

interface SearchableSelectProps {
  value?: string | number
  onSelect: (value: string | number) => void
  options: SearchableOption[]
  onSearch?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  detailsPanel?: (value: string | number | undefined) => React.ReactNode
}

export function SearchableSelect({
  value,
  onSelect,
  options,
  onSearch,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  loading = false,
  disabled = false,
  hasMore = false,
  onLoadMore,
  detailsPanel,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((o) => String(o.value) === String(value))

  return (
    <div className="space-y-2">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-8 font-normal"
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={(value) => onSearch?.(value)}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={String(option.value)}
                  onSelect={() => {
                    onSelect(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {hasMore && (
                <CommandItem
                  value="__load_more__"
                  onSelect={() => onLoadMore?.()}
                  className="justify-center text-muted-foreground"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load more...
                </CommandItem>
              )}
              {loading && !hasMore && (
                <CommandItem
                  value="__loading__"
                  disabled
                  className="justify-center text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    {value !== undefined && value !== null && value !== "" && detailsPanel?.(value)}
    </div>
  )
}
