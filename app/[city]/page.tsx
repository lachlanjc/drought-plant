import { getHistoricalPrecip, AVG_PRECIP_BY_MONTH } from "./api/precip";
import { Chart } from "../components/chart";
import Plant from "../components/shader";
import { CITIES } from "../../lib/citites";

export const revalidate = 3600; // invalidate every hour

function getCityName(city: string) {
  return city.length <= 3
    ? city.toUpperCase()
    : city.charAt(0).toUpperCase() + city.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityName = getCityName(city);
  return {
    title: `${cityName} Drought Plant`,
    description: `A digital plant as dead or alive as ${cityName}’s recent rainfall.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityName = getCityName(city);
  const data = await getHistoricalPrecip(city as keyof typeof CITIES);
  const totalPrecip = data.reduce((acc, { precip }) => acc + precip, 0);

  const month = new Date();
  const thisMonthAbbrev = month.toLocaleDateString("en-US", { month: "short" });
  month.setMonth(month.getMonth() - 1);
  // const lastMonthAbbrev = month.toLocaleDateString("en-US", { month: "short" });
  const avgPrecip =
    // @ts-expect-error TS doesn't know months
    AVG_PRECIP_BY_MONTH[thisMonthAbbrev]; // + AVG_PRECIP_BY_MONTH[lastMonthAbbrev];
  // data.at(-1)?.avg || 0;
  // Convert cm to mm
  const percentFromAvg = (totalPrecip - avgPrecip) / avgPrecip;

  return (
    <div className="h-screen relative flex flex-col items-center gap-4 text-[hsl(43_26%_48%)]">
      <span className="absolute top-8 left-1/2 -translate-x-1/2 border-2 border-current rounded-full px-4 py-2 font-bold">
        {cityName}
      </span>
      <Plant initialWaterLevel={100 + percentFromAvg * 100} />
      <p className="text-center text-lg text-balance tabular-nums px-6 -mt-2">
        {totalPrecip.toFixed(2)}cm of rain in the last month, vs{" "}
        {avgPrecip.toFixed(2)}cm avg
      </p>
      <p className="text-center text-4xl px-6 -mt-3">
        <strong className="text-[hsl(43_26%_24%)] font-semibold">
          {(totalPrecip - avgPrecip).toFixed(2)}cm
        </strong>
      </p>
      <Chart data={data} />
    </div>
  );
}
