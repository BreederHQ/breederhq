// useAsyncList.ts  (fetcher is yours; this just manages state + reloading)
export function useAsyncList<T>(
  fetcher: (params?: any) => Promise<{ items: T[]; total?: number } | T[]>,
  params: any,
) {
  const [items, setItems] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  React.useEffect(() => {
    let ignore = false;
    setLoading(true); setError("");
    Promise.resolve(fetcher(params))
      .then((res) => {
        if (ignore) return;
        const arr = Array.isArray(res) ? res : (res.items ?? []);
        const tot = Array.isArray(res) ? arr.length : (res.total ?? arr.length);
        setItems(arr); setTotal(tot);
      })
      .catch((e) => !ignore && setError(e?.message || "Failed to load"))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [fetcher, JSON.stringify(params)]);
  return { items, total, loading, error, setItems, reloadParams: params };
}
