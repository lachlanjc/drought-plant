import { fetchWeatherApi } from "openmeteo";
import { CITIES } from "../../../lib/citites";

export type HistoricalPrecip = Array<{
  dt: string;
  precip: number;
  avg: number;
}>;

// in CM
export const AVG_PRECIP_BY_MONTH = {
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

export async function getHistoricalPrecip(city: keyof typeof CITIES = "sf"): Promise<HistoricalPrecip> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const params = {
    latitude: CITIES[city][0],
    longitude: CITIES[city][1],
    start_date: oneMonthAgo.toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    daily: "precipitation_sum",
    temperature_unit: "fahrenheit",
    timezone: "America/New_York",
  };
  const url = "https://archive-api.open-meteo.com/v1/archive";
  const responses = await fetchWeatherApi(url, params);

  // Helper function to form time ranges
  const range = (start: number, stop: number, step: number) =>
    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];

  // Attributes for timezone and location
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const daily = response.daily()!;

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const weatherData = {
    daily: {
      time: range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      precipitationSum: daily.variables(0)!.valuesArray()!,
    },
  };

  const res: HistoricalPrecip = [];

  // `weatherData` now contains a simple structure with arrays for datetime and weather data
  for (let i = 0; i < weatherData.daily.time.length; i++) {
    const dt = weatherData.daily.time[i];
    // get expected precip for this month
    const monthAbbrev = dt.toLocaleDateString("en-US", { month: "short" });
    const daysInMonth = new Date(dt.getFullYear(), dt.getMonth(), 0).getDate();
    // @ts-expect-error TS doesn't know months
    const avg = AVG_PRECIP_BY_MONTH[monthAbbrev] / daysInMonth;
    res.push({
      dt: dt.toISOString().split("T")[0],
      precip: weatherData.daily.precipitationSum[i] / 10 || 0,
      avg,
    });
  }

  return res;
}
