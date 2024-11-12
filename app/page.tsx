import Image from "next/image";
import { getHistoricalRainfall } from "./api/route";
import { Chart } from "./components/chart";

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
  return (
    <div>
      <h1>Historical Rainfall</h1>
      <Chart data={historical} />
      <h1>Average Rainfall</h1>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Rainfall (mm)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(AVG_PRECIP_BY_MONTH).map(([month, rainfall]) => (
            <tr key={month}>
              <td>{month}</td>
              <td>{rainfall}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
