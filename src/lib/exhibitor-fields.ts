import type { ExhibitorInput } from "./exhibitors.functions";

export type FieldTone = "gold" | "slate" | "cyan" | "blue" | "green" | "teal";

export type ExhibitorField = {
  key: keyof ExhibitorInput;
  label: string;
  short: string;
  tone: FieldTone;
  placeholder: string;
  wide?: boolean;
};

export const EXHIBITOR_FIELDS: ExhibitorField[] = [
  {
    key: "booth_number",
    label: "Booth #",
    short: "BOOTH #",
    tone: "slate",
    placeholder: "312",
  },
  {
    key: "exhibitor_name",
    label: "Exhibitor Name",
    short: "EXHIBITOR",
    tone: "gold",
    placeholder: "Skyline",
    wide: true,
  },
  {
    key: "pro_number",
    label: "PRO #",
    short: "PRO #",
    tone: "cyan",
    placeholder: "548799453",
  },
  {
    key: "invoice_number",
    label: "Invoice #",
    short: "INV #",
    tone: "cyan",
    placeholder: "1671",
  },
  {
    key: "city",
    label: "City",
    short: "CITY",
    tone: "blue",
    placeholder: "Middletown",
  },
  {
    key: "state",
    label: "ST",
    short: "ST",
    tone: "blue",
    placeholder: "CT",
  },
  {
    key: "estimated_weight",
    label: "Estimated Weight",
    short: "EST WT",
    tone: "blue",
    placeholder: "145",
  },
  {
    key: "shipping_date",
    label: "Shipping Date",
    short: "SHIP DATE",
    tone: "green",
    placeholder: "5/19/26",
  },
  {
    key: "delivery_date",
    label: "Delivery Date",
    short: "DEL DATE",
    tone: "green",
    placeholder: "5/26/26",
  },
  {
    key: "actual_costs",
    label: "Actual Costs",
    short: "COSTS",
    tone: "teal",
    placeholder: "$615.20",
  },
  {
    key: "final_invoice",
    label: "Final Invoice",
    short: "FINAL INV",
    tone: "teal",
    placeholder: "$1,015.24",
  },
  {
    key: "actual_revenue",
    label: "Actual Revenue",
    short: "REVENUE",
    tone: "teal",
    placeholder: "$399.04",
  },
];

export const EMPTY_EXHIBITOR: ExhibitorInput = {
  booth_number: "",
  exhibitor_name: "",
  pro_number: "",
  invoice_number: "",
  city: "",
  state: "",
  estimated_weight: "",
  shipping_date: "",
  delivery_date: "",
  actual_costs: "",
  final_invoice: "",
  actual_revenue: "",
};

export const TONE_HEADER: Record<FieldTone, string> = {
  gold: "bg-sheet-gold text-sheet-gold-foreground",
  slate: "bg-sheet-slate text-sheet-slate-foreground",
  cyan: "bg-sheet-cyan text-sheet-cyan-foreground",
  blue: "bg-sheet-blue text-sheet-blue-foreground",
  green: "bg-sheet-green text-sheet-green-foreground",
  teal: "bg-sheet-teal text-sheet-teal-foreground",
};

export const TONE_ACCENT: Record<FieldTone, string> = {
  gold: "bg-sheet-gold",
  slate: "bg-sheet-slate",
  cyan: "bg-sheet-cyan",
  blue: "bg-sheet-blue",
  green: "bg-sheet-green",
  teal: "bg-sheet-teal",
};
