"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const DONUT_COLORS = ["#dfb96f", "#c9a15a", "#b9863c", "#8a6530", "#5f4620"];

export function RevenueTrendChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a15a" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#c9a15a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--popover-foreground)" }}
          formatter={(value) =>
            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
          }
        />
        <Area type="monotone" dataKey="total" stroke="#c9a15a" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ServiceDonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados no período.</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="text-muted-foreground">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
