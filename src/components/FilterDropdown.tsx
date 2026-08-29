import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
};

export function FilterDropdown({
  icon: Icon,
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  icon: LucideIcon;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((option) => option.value === value) ?? options[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-4 pr-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus:outline-2 focus:-outline-offset-2 focus:outline-primary data-[state=open]:bg-muted",
          className,
        )}
      >
        <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{active?.label}</span>
        {open ? (
          <ChevronUp aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-64 overflow-y-auto rounded-xl p-2"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                selected && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {selected ? (
                <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
