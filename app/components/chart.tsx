"use client";

import {
  Area,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { HistoricalPrecip } from "../api/precip";

const chartConfig = {
  precip: {
    label: "Recorded",
    color: "#2563eb",
  },
  avg: {
    label: "Average rainfall",
    color: "hsl(43 74% 66%)",
  },
} satisfies ChartConfig;

export function Chart({ data }: { data: HistoricalPrecip }) {
  // apply running sums
  const sumData: HistoricalPrecip = [];
  sumData.push(data?.[0]);
  for (let i = 1; i < data.length; i++) {
    sumData.push({
      dt: data[i].dt,
      precip: data[i].precip + sumData[i - 1].precip,
      avg: data[i].avg + sumData[i - 1].avg,
    });
  }
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ComposedChart accessibilityLayer data={sumData} margin={{ right: 24 }}>
        <CartesianGrid horizontal={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              formatter={(value, name, item) => (
                <div className="flex gap-2 w-[180px] items-center text-xs text-muted-foreground">
                  <div
                    className={"shrink-0 rounded-[2px] h-1 w-3"}
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {Number(value).toFixed(2)}
                    <span className="font-normal text-muted-foreground">
                      cm
                    </span>
                  </div>
                </div>
              )}
            />
          }
        />
        <YAxis
          type="number"
          domain={[0, 12]}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${value}mm`}
        />
        <XAxis
          dataKey="dt"
          tickLine={false}
          minTickGap={64}
          axisLine={false}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <defs>
          <linearGradient id="fillPrecip" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-precip)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-precip)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Line
          dataKey="avg"
          type="natural"
          strokeWidth={2}
          stroke="hsl(37 26% 72%)"
          strokeDasharray="8 6"
          dot={false}
        />
        <Area
          dataKey="precip"
          type="natural"
          fill="url(#fillPrecip)"
          fillOpacity={0.4}
          stroke="var(--color-precip)"
          strokeWidth={2}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
