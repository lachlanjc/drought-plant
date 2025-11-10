import { fetchWeatherApi } from "openmeteo";
import { CITIES } from "../../../lib/citites";

export type HistoricalPrecip = Array<{
  dt: string;
  precip: number;
  avg: number;
}>;

export type HistoricalPrecipData = {
  data: HistoricalPrecip;
  totalAvg: number;
};

export async function getHistoricalPrecip(city: keyof typeof CITIES = "sf"): Promise<HistoricalPrecipData> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const params = {
    latitude: CITIES[city].coords[0],
    longitude: CITIES[city].coords[1],
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
  let totalAvg = 0;

  // `weatherData` now contains a simple structure with arrays for datetime and weather data
  for (let i = 0; i < weatherData.daily.time.length; i++) {
    const dt = weatherData.daily.time[i];
    // get expected precip for this month
    const monthIndex = dt.getMonth(); // 0-11
    const daysInMonth = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    // Get average from CITIES monthly array (in mm) and divide by days in month
    const avg = CITIES[city].monthly[monthIndex] / daysInMonth;
    totalAvg += avg;
    res.push({
      dt: dt.toISOString().split("T")[0],
      precip: weatherData.daily.precipitationSum[i] / 10 || 0,
      avg,
    });
  }

  return { data: res, totalAvg };
}
