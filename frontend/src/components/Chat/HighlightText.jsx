/**
 * Renders `text` with every case-insensitive occurrence of `query`
 * wrapped in a yellow highlight span.
 * If query is empty, renders plain text.
 */
export default function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;

  const lower      = query.toLowerCase();
  const parts      = [];
  let   remaining  = text;
  let   keyIndex   = 0;

  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(lower);
    if (idx === -1) {
      parts.push(<span key={keyIndex++}>{remaining}</span>);
      break;
    }
    // Text before match
    if (idx > 0) {
      parts.push(<span key={keyIndex++}>{remaining.slice(0, idx)}</span>);
    }
    // The match itself
    parts.push(
      <mark
        key={keyIndex++}
        className="bg-yellow-400/80 text-bg-primary rounded-[2px] px-[1px] not-italic"
      >
        {remaining.slice(idx, idx + lower.length)}
      </mark>
    );
    remaining = remaining.slice(idx + lower.length);
  }

  return <>{parts}</>;
}
