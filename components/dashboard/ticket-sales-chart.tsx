"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = { name: string; tickets: number };

export function TicketSalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(1 0 0 / 8%)"
            vertical={false}
          />
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
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.19 0.02 285)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="tickets"
            fill="oklch(0.58 0.24 285)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
