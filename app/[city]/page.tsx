import { getHistoricalPrecip } from "./api/precip";
import { Chart } from "../components/chart";
import Plant from "../components/shader";
import { CITIES, getCityName } from "../../lib/citites";
import { CitiesSelect } from "../components/cities";

export const revalidate = 3600; // invalidate every hour

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
  const { data, totalAvg } = await getHistoricalPrecip(
    city as keyof typeof CITIES
  );
  const totalPrecip = data.reduce((acc, { precip }) => acc + precip, 0);

  const percentFromAvg = (totalPrecip - totalAvg) / totalAvg;

  return (
    <div className="h-screen relative flex flex-col items-center gap-4 text-[hsl(43_26%_48%)]">
      <CitiesSelect currentCity={city} />
      <Plant initialWaterLevel={100 + percentFromAvg * 100} />
      <p className="text-center text-lg text-balance tabular-nums px-6 -mt-2">
        {(totalPrecip / 10).toFixed(2)}cm of rain in the last month, vs{" "}
        {(totalAvg / 10).toFixed(2)}cm avg
      </p>
      <p className="text-center text-4xl px-6 -mt-3">
        <strong className="text-[hsl(43_26%_24%)] font-semibold">
          △ {((totalPrecip - totalAvg) / 10).toFixed(2)}cm
        </strong>
      </p>
      <Chart data={data} />
    </div>
  );
}
