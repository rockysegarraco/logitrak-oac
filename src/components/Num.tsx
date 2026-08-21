/**
 * Renders text with any numeric runs styled in the numeric display font.
 */
export function Num({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }
  const text = String(children);
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
