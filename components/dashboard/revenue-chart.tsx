"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = { name: string; revenue: number };

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.58 0.24 285)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.58 0.24 285)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "oklch(0.65 0.02 285)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "oklch(0.65 0.02 285)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.19 0.02 285)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "oklch(0.92 0 0)" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="oklch(0.58 0.24 285)"
            fill="url(#revenueFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
