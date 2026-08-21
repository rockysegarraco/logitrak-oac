import { applyValueCase, type ValueCase } from "@/lib/text-case";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps digit runs in the numeric display font. */
function renderDigits(text: string, keyPrefix: string) {
  return text.split(/(\d+(?:[.,]\d+)*)/g).map((part, i) =>
    /^\d/.test(part) ? (
      <span key={`${keyPrefix}-${i}`} className="num">
        {part}
      </span>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

/**
 * Renders text with any numeric runs styled in the numeric display font.
 * Optionally normalizes letter casing and highlights a search match.
 */
export function Num({
  children,
  caseMode = "sentence",
  highlight,
}: {
  children: React.ReactNode;
  caseMode?: ValueCase;
  highlight?: string;
}) {
  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }
  const text = applyValueCase(String(children), caseMode);
  const term = highlight?.trim();

  if (!term) return <>{renderDigits(text, "t")}</>;

  const chunks = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return (
    <>
      {chunks.map((chunk, i) =>
        chunk.toLowerCase() === term.toLowerCase() && chunk.length > 0 ? (
          <mark
            key={`m-${i}`}
            className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40"
          >
            {renderDigits(chunk, `m${i}`)}
          </mark>
        ) : (
          <span key={`c-${i}`}>{renderDigits(chunk, `c${i}`)}</span>
        ),
      )}
    </>
  );
}
