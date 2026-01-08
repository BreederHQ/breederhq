// apps/animals/src/components/ProducingRecordSection.tsx
// Producing record section for sires and dams - shows offspring title stats

import React, { useEffect, useState } from "react";
import { makeApi, type ProducingRecord } from "../api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  sex?: string | null;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function ProducingRecordSection({ animal }: { animal: AnimalRow }) {
  const [record, setRecord] = useState<ProducingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.animals.getProducingRecord(animal.id);
        if (!cancelled) {
          setRecord(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          // 404 is expected if no offspring
          if (err?.status === 404) {
            setRecord({
              totalOffspring: 0,
              titledOffspring: 0,
              championOffspring: 0,
              grandChampionOffspring: 0,
              titleCountsByCategory: {},
              titledOffspringList: [],
            });
          } else {
            setError(err.message || "Failed to load producing record");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecord();

    return () => {
      cancelled = true;
    };
  }, [animal.id]);

  if (loading) {
    return (
      <div className="p-4 text-center text-secondary text-sm">
        Loading producing record...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!record || record.totalOffspring === 0) {
    return (
      <div className="p-4 text-center text-secondary text-sm">
        No offspring recorded
      </div>
    );
  }

  const roleLabel = (animal.sex || "").toLowerCase().startsWith("m") ? "Sire" : "Dam";

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {record.totalOffspring}
          </div>
          <div className="text-xs text-secondary">Total Offspring</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
            {record.titledOffspring}
          </div>
          <div className="text-xs text-secondary">Titled Offspring</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {record.championOffspring}
          </div>
          <div className="text-xs text-secondary">Champions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {record.grandChampionOffspring}
          </div>
          <div className="text-xs text-secondary">Grand Champions</div>
        </div>
      </div>

      {/* Titled offspring list */}
      {record.titledOffspringList.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-secondary mb-2">
            Titled Offspring ({record.titledOffspringList.length})
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {record.titledOffspringList.map((offspring) => (
              <div
                key={offspring.id}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-medium">
                  {offspring.name || `Animal #${offspring.id}`}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {offspring.titles.map((title, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-xs font-bold text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Producing percentage */}
      {record.totalOffspring > 0 && (
        <div className="text-center pt-2 border-t border-hairline">
          <span className="text-sm text-secondary">
            {roleLabel} of{" "}
            <span className="font-bold text-[hsl(var(--brand-orange))]">
              {((record.titledOffspring / record.totalOffspring) * 100).toFixed(0)}%
            </span>{" "}
            titled offspring
            {record.championOffspring > 0 && (
              <>
                {" "}
                ({((record.championOffspring / record.totalOffspring) * 100).toFixed(0)}% champions)
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default ProducingRecordSection;
