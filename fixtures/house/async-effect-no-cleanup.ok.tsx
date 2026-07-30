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

// ── Mount-only effect: an EMPTY dependency array. ────────────────────────────
// Both failures this rule describes need the effect to RE-RUN. With `[]` there
// is never a second request in flight to race the first, and since React 18 a
// setState on an unmounted component is a silent no-op rather than a leak.
// Flagging this would be objecting to fetch-on-mount, which is not a defect.
// Real shape: shipwright apps/web/src/notifications/NotificationsView.tsx:23.
export function NotificationsView() {
  const [projects, setProjects] = useState<string[]>([]);
  useEffect(() => {
    fetchProjects({ archived: false })
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);
  return projects.length;
}
