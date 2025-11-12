"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES, getCityName } from "@/lib/citites";
import Link from "next/link";

export function CitiesSelect({ currentCity }: { currentCity: string }) {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
      {Object.keys(CITIES).map((city) => (
        <Link
          href={`/${city}`}
          key={city}
          className={`border-2 border-current rounded-full px-4 py-2 font-bold opacity-50 transition-opacity hover:opacity-75`}
          aria-current={currentCity === city ? "page" : "false"}
          style={{ opacity: currentCity === city ? 1 : 0.5 }}
        >
          {getCityName(city)}
        </Link>
      ))}
    </div>
    // <Select value={currentCity} onValueChange={handleValueChange}>
    //   <SelectTrigger className="w-[180px] !shadow-none !border-none">
    //     <SelectValue placeholder="Select a city" />
    //   </SelectTrigger>
    //   <SelectContent>
    //     {Object.keys(CITIES).map((city) => (
    //       <SelectItem key={city} value={city}>
    //         {getCityName(city)}
    //       </SelectItem>
    //     ))}
    //   </SelectContent>
    // </Select>
  );
}
