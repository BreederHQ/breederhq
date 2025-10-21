import * as React from "react";

export function useSelection<ID = string | number>() {
  const [set, _set] = React.useState<Set<ID>>(() => new Set());
  const isSelected = (id: ID) => set.has(id);
  const toggle = (id: ID) => _set(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clear = () => _set(new Set());
  const toggleAllOnPage = (ids: ID[]) =>
    _set(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        const n = new Set(prev); ids.forEach(id => n.delete(id)); return n;
      }
      const n = new Set(prev); ids.forEach(id => n.add(id)); return n;
    });
  const headerStateFor = (ids: ID[]) => {
    if (!ids.length) return { checked: false, indeterminate: false };
    const count = ids.filter(id => set.has(id)).length;
    return { checked: count === ids.length, indeterminate: count > 0 && count < ids.length };
  };
  return { set, isSelected, toggle, clear, toggleAllOnPage, headerStateFor, count: set.size, selectedIds: Array.from(set) };
}
