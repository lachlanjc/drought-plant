"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { HistoricalPrecip } from "../api/precip";

const chartConfig = {
  precip: {
    label: "Precip.",
    color: "#2563eb",
  },
  // mobile: {
  //   label: "Mobile",
  //   color: "#60a5fa",
  // },
} satisfies ChartConfig;

export function Chart({ data }: { data: HistoricalPrecip }) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid horizontal={false} />
        <Bar dataKey="precip" fill="var(--color-precip)" radius={4} />
        {/* <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} /> */}
        <ChartTooltip content={<ChartTooltipContent />} />
        <XAxis
          dataKey="dt"
          tickLine={false}
          // tickMargin={10}
          axisLine={false}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
      </BarChart>
    </ChartContainer>
  );
}
