"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export default function Component({
  initialWaterLevel = 50,
}: {
  initialWaterLevel?: number;
}) {
  const [waterLevel, setWaterLevel] = useState(initialWaterLevel);

  const stemColor =
    waterLevel > 50
      ? `rgb(0, ${Math.round(waterLevel * 2.55)}, 0)`
      : `rgb(${Math.round(255 - waterLevel * 2.55)}, ${Math.round(waterLevel * 2.55)}, 0)`;
  const leafColor =
    waterLevel > 50
      ? `rgb(0, ${Math.round(waterLevel * 2.55)}, 0)`
      : `rgb(${Math.round(255 - waterLevel * 2.55)}, ${Math.round(waterLevel * 2.55)}, 0)`;
  const stemHeight = 100 + (waterLevel - 50);
  const leafScale = 0.5 + (waterLevel / 100) * 0.5;
  const stemCurve = waterLevel < 50 ? (50 - waterLevel) * 0.5 : 0;

  return (
    <div className="flex flex-col h-[75vh] gap-6 items-center">
      <svg width="600" height="800" viewBox="0 0 300 400">
        {/* Pot */}
        <path
          d="M75 361.25C75 411.25 225 411.25 225 361.25L240 286.25C240 271.25 60 271.25 60 286.25L75 361.25Z"
          fill="#E35336"
        />
        <path
          d="M150 304.169C199.706 304.169 240 296.193 240 286.355C240 276.517 199.706 268.542 150 268.542C100.294 268.542 60 276.517 60 286.355C60 296.193 100.294 304.169 150 304.169Z"
          fill="#8B4513"
        />

        {/* Stem */}
        <path
          d={`M150 300 Q${150 + stemCurve} ${300 - stemHeight / 2} 150 ${300 - stemHeight}`}
          stroke={stemColor}
          strokeWidth="10"
          fill="none"
          style={{ transition: "all 0.5s ease-in-out" }}
        />

        {/* Monstera Leaves */}
        <g
          transform={`translate(150, ${300 - stemHeight}) scale(${leafScale})`}
          style={{ transition: "all 0.5s ease-in-out" }}
        >
          {/* Leaf 1 */}
          <path
            d="M0 0 C-30 -30, -60 -45, -90 -30 C-60 -60, -30 -75, 0 -60 C30 -75, 60 -60, 90 -30 C60 -45, 30 -30, 0 0"
            fill={leafColor}
          />
          {/* Leaf 2 */}
          <path
            d="M30 -20 C0 -50, -30 -65, -60 -50 C-30 -80, 0 -95, 30 -80 C60 -95, 90 -80, 120 -50 C90 -65, 60 -50, 30 -20"
            fill={leafColor}
            transform="rotate(45)"
          />
          {/* Leaf 3 */}
          <path
            d="M-30 -20 C0 -50, 30 -65, 60 -50 C30 -80, 0 -95, -30 -80 C-60 -95, -90 -80, -120 -50 C-90 -65, -60 -50, -30 -20"
            fill={leafColor}
            transform="rotate(-45)"
          />
        </g>
      </svg>

      <div className="mt-8 w-64">
        <Slider
          value={[waterLevel]}
          onValueChange={(value) => setWaterLevel(value[0])}
          max={100}
          step={1}
          className="w-full"
          style={{
            // @ts-expect-error custom property
            "--primary": "10.06deg 75.55% 55.1%",
          }}
        />
      </div>
    </div>
  );
}
