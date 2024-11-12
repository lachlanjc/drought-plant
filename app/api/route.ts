import { NextResponse } from "next/server";
import { getHistoricalPrecip } from "./precip";

export async function GET() {
  const data = await getHistoricalPrecip();
  return NextResponse.json(data);
}
