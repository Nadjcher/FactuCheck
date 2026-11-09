import type { Metadata } from "next";
import { TesterClient } from "@/components/tester/tester-client";

export const metadata: Metadata = { title: "Tester une facture" };

export default function TesterPage() {
  return (
    <div className="container py-12">
      <TesterClient />
    </div>
  );
}
