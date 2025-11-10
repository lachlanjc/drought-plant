export const CITIES: Record<
  string,
  { coords: [number, number]; monthly: number[] }
> = {
  nyc: {
    coords: [40.7362621, -73.9911719],
    // prettier-ignore
    monthly: [93.6, 83.9, 100.6, 105.7, 111.6, 138.4, 113.7, 121.6, 97.0, 108.9, 73.3, 127.4],
  },
  sf: {
    coords: [37.774929, -122.419416],
    // prettier-ignore
    monthly: [70.3, 74.8, 84.5, 44.6, 7.1, 5.2, 0.4, 0.7, 3.4, 23.1, 43.3, 111.5],
  },
  la: {
    coords: [34.052234, -118.243685],
    // prettier-ignore
    monthly: [49.1, 39.1, 34.9, 14.1, 6.2, 0.4, 1.3, 0.1, 4.6, 9.2, 14.5, 61.3],
  },
};

export function getCityName(city: string) {
  return city.length <= 3
    ? city.toUpperCase()
    : city.charAt(0).toUpperCase() + city.slice(1);
}
