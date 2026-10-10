import type { Metadata } from "next";
import LeaderboardPage from "./LeaderboardPage";

export const metadata: Metadata = {
  title: "Liderlik tablosu · Avare",
  description: "Avare oyunlarının genel ve oyun bazında liderlik tablosu.",
};

export default function Page() {
  return <LeaderboardPage />;
}
