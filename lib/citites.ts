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
  // btv: {
  //   coords: [44.475683,-73.220070],
  //   // prettier-ignore
  //   monthly: [49.3,55.2,59.4,80.7,106.6,130.9,114.2,82.4,81.0,114.5,59.2,89.1],
  // }
  cdmx: {
    coords: [19.432608, -99.133209],
    // prettier-ignore
    monthly: [21.3,20.7,25.8,45.4,72.5,172.8,200.6,203.0,200.6,98.4,33.3,14.3],
  }
};

export function getCityName(city: string) {
  return city.length <= 4
    ? city.toUpperCase()
    : city.charAt(0).toUpperCase() + city.slice(1);
}
