import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return <AuthForm mode="connexion" />;
}
