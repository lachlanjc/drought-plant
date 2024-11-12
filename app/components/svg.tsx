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
    <>
      <svg
        width="600"
        height="800"
        viewBox="0 0 300 400"
        className="w-auto flex-shrink-0"
        style={{ height: "min(70vh, 100vh - 400px)" }}
      >
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
          d={`M150 290 Q${150 + stemCurve} ${290 - stemHeight / 2} 150 ${290 - stemHeight}`}
          stroke={stemColor}
          strokeWidth={8}
          strokeLinecap="square"
          fill="none"
          style={{ transition: "all 0.375s ease-in-out" }}
        />

        {/* Monstera Leaves */}
        <g
          transform={`translate(150, ${290 - stemHeight}) scale(${leafScale})`}
          style={{ transition: "all 0.375s ease-in-out" }}
        >
          {/* Leaf 1 */}
          <path
            d="M0 0 C-30 -30, -60 -45, -90 -30 C-60 -60, -30 -75, 0 -60 C30 -75, 60 -60, 90 -30 C60 -45, 30 -30, 0 0"
            fill={leafColor}
            opacity={0.75}
          />
          {/* Leaf 2 */}
          <path
            d="M30 -20 C0 -50, -30 -65, -60 -50 C-30 -80, 0 -95, 30 -80 C60 -95, 90 -80, 120 -50 C90 -65, 60 -50, 30 -20"
            fill={leafColor}
            transform="scale(0.75) rotate(35)"
          />
          {/* Leaf 3 */}
          <path
            d="M-30 -20 C0 -50, 30 -65, 60 -50 C30 -80, 0 -95, -30 -80 C-60 -95, -90 -80, -120 -50 C-90 -65, -60 -50, -30 -20"
            fill={leafColor}
            transform="scale(0.75) rotate(-35)"
          />
        </g>
      </svg>

      <div className="mt-3 w-full flex flex-col md:flex-row gap-1 justify-center items-center">
        <Slider
          value={[waterLevel]}
          onValueChange={(value) => setWaterLevel(value[0])}
          max={100}
          step={1}
          style={{
            width: "min(18rem, 100%)",
          }}
        />
        <span className="tabular-nums w-[9.5ch] text-sm text-center md:text-right">
          {waterLevel.toFixed(0)}% of avg
        </span>
      </div>
    </>
  );
}
