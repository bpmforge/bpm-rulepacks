import { useEffect, useState } from "react";

// Awaits a fetch and returns no cleanup. On unmount the resolve path still
// calls setState; on a dependency change two requests race and the slower one
// wins, so the panel shows stale data that looks current.
export function DocPanel({ path }: { path: string }) {
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const d = await fetchDoc(path);
      setDoc(d);
    })();
  }, [path]);
  return <pre>{doc}</pre>;
}
