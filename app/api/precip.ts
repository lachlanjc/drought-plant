import { fetchWeatherApi } from "openmeteo";

export type HistoricalPrecip = Array<{
  dt: string;
  precip: number;
}>;

export async function getHistoricalPrecip(): Promise<HistoricalPrecip> {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const params = {
    latitude: 40.7362621,
    longitude: -73.9911719,
    start_date: twoMonthsAgo.toISOString().split("T")[0],
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
    res.push({
      dt: weatherData.daily.time[i].toISOString(),
      precip: weatherData.daily.precipitationSum[i] || 0,
    });
  }

  return res;
}
