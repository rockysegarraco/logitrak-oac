# Exhibitor Shipping Tracker

A simple web version of the exhibitor tracking spreadsheet: a shared list everyone can view, plus a form to add new exhibitors and edit existing ones. No login required.

## Fields (from the spreadsheet)

- Exhibitor Name
- Booth #
- PAF in Files?
- Request for PAF sent?
- On Time Quote Sent?
- On-Time shipment Charges Processed?
- Late Fee Quote Sent?
- Receiver Number(s) - ON TIME
- Receiver Number(s) - LATE

All status fields are free-text, so entries like `YES (SENT 1/28/29)` or `DRAFT 1671` can be typed exactly as in the sheet.

## Screens

1. **Tracker list (`/`)** — spreadsheet-style table with the color-coded header bar matching the original (gold name column, blue status columns, green late-fee column). Each row is clickable to edit. Includes a search box to filter by exhibitor name or booth, plus an "Add Exhibitor" button.
2. **New exhibitor (`/new`)** — a form with all nine fields; saving returns to the list where the new row appears immediately.
3. **Edit exhibitor (`/exhibitor/$id`)** — same form pre-filled, with Save and Delete.

## Data

Stored in Lovable Cloud so the list is shared across everyone and persists. One `exhibitors` table with the nine fields plus created/updated timestamps. Open read/write access (no login), matching the "anyone with the link" choice.

## Technical notes

- Enable Lovable Cloud; migration creates `public.exhibitors` with text columns, GRANTs for `anon`/`authenticated`/`service_role`, RLS enabled with permissive public policies.
- Routes: `src/routes/index.tsx` (list), `src/routes/new.tsx`, `src/routes/exhibitor.$id.tsx`, each with its own `head()` metadata.
- Reads/writes via `createServerFn` in `src/lib/exhibitors.functions.ts`; list route loader primes TanStack Query, components use `useSuspenseQuery` / `useMutation` with cache invalidation.
- Shared form component with react-hook-form + zod validation (name required, sensible max lengths); `sonner` toasts for save/delete feedback, mounted once in `__root.tsx`.
- Table is horizontally scrollable on small screens; on mobile rows collapse into stacked cards.
