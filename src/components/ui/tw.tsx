import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tailwind UI style primitives: plain elements styled with Tailwind utilities
 * mapped to the project's semantic tokens.
 */

const base =
  "inline-flex items-center justify-center gap-x-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none";


const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-card text-foreground ring-1 ring-inset ring-border hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  ghost: "text-muted-foreground hover:text-foreground shadow-none",
} as const;

export type TwButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export const TwButton = React.forwardRef<HTMLButtonElement, TwButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  ),
);
TwButton.displayName = "TwButton";

export const twButtonClass = (variant: keyof typeof variants = "primary") =>
  cn(base, variants[variant]);

export const TwInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "block w-full rounded-md bg-card px-3 py-1.5 text-base text-foreground outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground/70 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6",
      className,
    )}
    {...props}
  />
));
TwInput.displayName = "TwInput";

export function TwLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm/6 font-medium text-foreground", className)}
      {...props}
    />
  );
}
