import type { ExhibitorInput } from "./exhibitors.functions";

export type FieldTone = "gold" | "slate" | "cyan" | "blue" | "green" | "teal";

export type ExhibitorField = {
  key: keyof ExhibitorInput;
  label: string;
  tone: FieldTone;
  placeholder: string;
  wide?: boolean;
};

export const EXHIBITOR_FIELDS: ExhibitorField[] = [
  {
    key: "exhibitor_name",
    label: "Exhibitor Name",
    tone: "gold",
    placeholder: "Venn Technology",
  },
  { key: "booth_number", label: "Booth #", tone: "slate", placeholder: "102" },
  { key: "paf_in_files", label: "PAF in Files?", tone: "cyan", placeholder: "YES" },
  {
    key: "request_for_paf_sent",
    label: "Request for PAF sent?",
    tone: "cyan",
    placeholder: "YES (SENT 1/28/29)",
    wide: true,
  },
  {
    key: "on_time_quote_sent",
    label: "On Time Quote Sent?",
    tone: "blue",
    placeholder: "YES (1/29)",
  },
  {
    key: "on_time_charges_processed",
    label: "On-Time shipment Charges Processed?",
    tone: "blue",
    placeholder: "charged 1/30",
    wide: true,
  },
  {
    key: "late_fee_quote_sent",
    label: "Late Fee Quote Sent?",
    tone: "green",
    placeholder: "DRAFT 1671",
  },
  {
    key: "receiver_numbers_on_time",
    label: "Receiver Number(s) - ON TIME",
    tone: "teal",
    placeholder: "4088,",
  },
  {
    key: "receiver_numbers_late",
    label: "Receiver Number(s) - LATE",
    tone: "teal",
    placeholder: "4087, 4090",
  },
];

export const EMPTY_EXHIBITOR: ExhibitorInput = {
  exhibitor_name: "",
  booth_number: "",
  paf_in_files: "",
  request_for_paf_sent: "",
  on_time_quote_sent: "",
  on_time_charges_processed: "",
  late_fee_quote_sent: "",
  receiver_numbers_on_time: "",
  receiver_numbers_late: "",
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
