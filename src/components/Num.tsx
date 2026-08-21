import { applyValueCase, type ValueCase } from "@/lib/text-case";

/**
 * Renders text with any numeric runs styled in the numeric display font.
 * Optionally normalizes letter casing for display only.
 */
export function Num({
  children,
  caseMode = "sentence",
}: {
  children: React.ReactNode;
  caseMode?: ValueCase;
}) {
  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }
  const text = applyValueCase(String(children), caseMode);
  const parts = text.split(/(\d+(?:[.,]\d+)*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part) ? (
          <span key={i} className="num">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
