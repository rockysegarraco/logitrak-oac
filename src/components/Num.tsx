/**
 * Renders text with any numeric runs styled in the numeric display font.
 */
export function Num({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }
  const raw = String(children);
  // Display-only: soften SHOUTED values (no lowercase letters) to sentence case.
  const text =
    /[A-Z]/.test(raw) && !/[a-z]/.test(raw)
      ? raw.charAt(0) + raw.slice(1).toLowerCase()
      : raw;
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
