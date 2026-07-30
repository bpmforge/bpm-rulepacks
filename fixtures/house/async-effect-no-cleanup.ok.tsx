import { useEffect, useState } from "react";

// Aborts the in-flight request on unmount or dependency change.
export function DocPanelAborted({ path }: { path: string }) {
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      const d = await fetchDoc(path, { signal: ac.signal });
      setDoc(d);
    })();
    return () => ac.abort();
  }, [path]);
  return <pre>{doc}</pre>;
}

// A cancelled flag is equally correct — the rule must accept it, so this pins
// that boundary rather than demanding AbortController specifically.
export function DocPanelFlagged({ path }: { path: string }) {
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const d = await fetchDoc(path);
      if (!cancelled) setDoc(d);
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);
  return <pre>{doc}</pre>;
}

// A synchronous effect has nothing to cancel.
export function Counter() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(1);
  }, []);
  return <span>{n}</span>;
}
