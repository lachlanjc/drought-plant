import { getHistoricalRainfall } from "./api/route";
import { Chart } from "./components/chart";
import Plant from "./components/svg";

// in CM
const AVG_PRECIP_BY_MONTH = {
  Jan: 10.4902,
  Feb: 8.001,
  Mar: 11.0998,
  Apr: 10.8712,
  May: 11.9126,
  Jun: 9.7536,
  Jul: 11.7348,
  Aug: 10.7188,
  Sep: 10.7442,
  Oct: 9.779,
  Nov: 11.0744,
  Dec: 10.033,
};

export const revalidate = 3600; // invalidate every hour

export default async function Home() {
  const historical = await getHistoricalRainfall();
  const totalPrecip = historical.reduce((acc, { precip }) => acc + precip, 0);
  const month = new Date();
  const thisMonthAbbrev = month.toLocaleDateString("en-US", { month: "short" });
  month.setMonth(month.getMonth() - 1);
  const lastMonthAbbrev = month.toLocaleDateString("en-US", { month: "short" });
  const expectedPrecip =
    // @ts-expect-error TS doesn't know months
    AVG_PRECIP_BY_MONTH[thisMonthAbbrev] + AVG_PRECIP_BY_MONTH[lastMonthAbbrev];
  // Convert cm to mm
  const percentOfAvg = totalPrecip / (expectedPrecip * 10);

  return (
    <div className="h-[80vh]">
      <Plant initialWaterLevel={percentOfAvg * 100} />
      <p className="text-center">
        {totalPrecip.toFixed(1)} mm of rain has fallen in the last 30 days. This
        is {(percentOfAvg * 100).toFixed(0)}% of the expected rainfall for this
        time of year ({(expectedPrecip * 10).toFixed(1)} mm).
      </p>
      <Chart data={historical} />
    </div>
  );
}
