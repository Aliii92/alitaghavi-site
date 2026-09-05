import HomePage from "../components/HomePage";
import { getRequestLocale } from "../lib/server-locale";
export default async function Page() {
  return <HomePage initialLocale={await getRequestLocale()} />;
}
