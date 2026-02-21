"use client";

import { useState } from "react";

const INITIAL_LINES = 20;
const LINE_HEIGHT = 20;

export function JsonViewer({ content, maxHeight = 400, className = "" }: { content: string; maxHeight?: number; className?: string }) {
  const lines = content.split("\n");
  const [expanded, setExpanded] = useState(false);
  const isLong = lines.length > INITIAL_LINES;
  const visibleLines = expanded ? lines : lines.slice(0, INITIAL_LINES);
  const height = Math.min(visibleLines.length * LINE_HEIGHT, maxHeight);

  return (
    <div className={`overflow-hidden rounded-lg border border-black/10 bg-black/[0.02] ${className}`}>
      <pre className="overflow-auto p-3 text-xs font-mono leading-5 text-black/80" style={{ maxHeight: expanded ? undefined : height }}>
        <code>{visibleLines.join("\n")}</code>
        {isLong && !expanded && <span className="block pt-1 text-black/50">...</span>}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full border-t border-black/10 py-2 text-xs font-medium text-black/60 hover:bg-black/5 hover:text-black/80"
        >
          {expanded ? "Mostrar menos" : `Mostrar más (${lines.length - INITIAL_LINES} líneas)`}
        </button>
      )}
    </div>
  );
}
