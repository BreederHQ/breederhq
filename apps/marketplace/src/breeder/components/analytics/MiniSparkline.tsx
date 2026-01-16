// apps/marketplace/src/breeder/components/analytics/MiniSparkline.tsx
// Lightweight sparkline chart component for trend visualization

import * as React from "react";
import type { DailyDataPoint } from "./types";

interface MiniSparklineProps {
  data: DailyDataPoint[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showArea?: boolean;
  className?: string;
}

/**
 * A minimal SVG sparkline chart for showing trends.
 * No external charting library required.
 */
export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  strokeColor = "#22c55e", // green-500
  fillColor = "rgba(34, 197, 94, 0.15)",
  showArea = true,
  className = "",
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-text-tertiary text-xs ${className}`}
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  // Add padding for visual clarity
  const padding = { top: 2, bottom: 2, left: 1, right: 1 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - min) / range) * chartHeight;
    return { x, y };
  });

  // Create SVG path for the line
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ");

  // Create SVG path for the filled area (if enabled)
  const areaPath = showArea
    ? `${linePath} L ${points[points.length - 1].x},${height - padding.bottom} L ${padding.left},${height - padding.bottom} Z`
    : "";

  // Determine trend direction for color adjustment
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const isUpward = lastValue > firstValue;
  const isFlat = Math.abs(lastValue - firstValue) < range * 0.1;

  // Adjust colors based on trend
  const actualStrokeColor = isFlat ? "#6b7280" : isUpward ? strokeColor : "#ef4444";
  const actualFillColor = isFlat
    ? "rgba(107, 114, 128, 0.1)"
    : isUpward
      ? fillColor
      : "rgba(239, 68, 68, 0.1)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Trend chart showing ${isUpward ? "upward" : isFlat ? "flat" : "downward"} trend`}
    >
      {/* Area fill */}
      {showArea && <path d={areaPath} fill={actualFillColor} />}

      {/* Line */}
      <path d={linePath} fill="none" stroke={actualStrokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* End point dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill={actualStrokeColor} />
    </svg>
  );
}

/**
 * Sparkline with label showing the change percentage
 */
interface SparklineWithChangeProps extends MiniSparklineProps {
  changePercent?: number;
  showChange?: boolean;
}

export function SparklineWithChange({
  data,
  changePercent,
  showChange = true,
  ...props
}: SparklineWithChangeProps) {
  const calculatedChange = React.useMemo(() => {
    if (changePercent !== undefined) return changePercent;
    if (!data || data.length < 2) return 0;

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    if (firstValue === 0) return lastValue > 0 ? 100 : 0;
    return Math.round(((lastValue - firstValue) / firstValue) * 100);
  }, [data, changePercent]);

  const isPositive = calculatedChange > 0;
  const isNeutral = calculatedChange === 0;

  return (
    <div className="flex items-center gap-2">
      <MiniSparkline data={data} {...props} />
      {showChange && (
        <span
          className={`text-xs font-medium ${
            isNeutral
              ? "text-text-tertiary"
              : isPositive
                ? "text-green-400"
                : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {calculatedChange}%
        </span>
      )}
    </div>
  );
}

export default MiniSparkline;
