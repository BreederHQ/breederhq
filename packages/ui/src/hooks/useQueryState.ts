// useQueryState.ts
export function useQueryState(initial = "", storageKey?: string, debounceMs = 300) {
  const [q, setQ] = React.useState<string>(() => (storageKey ? localStorage.getItem(storageKey) || initial : initial));
  const dq = useDebounced(q, debounceMs);
  React.useEffect(() => { if (storageKey) try { localStorage.setItem(storageKey, q); } catch {} }, [q, storageKey]);
  return { q, setQ, dq, clear: () => setQ("") };
}
