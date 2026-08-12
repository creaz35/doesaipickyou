import type { Metadata } from "next";
import { SponsorThanks } from "@/components/SponsorThanks";

export const metadata: Metadata = {
  title: "Thanks, sponsor!",
  description: "Payment confirmation for your sponsor spot.",
};

export default function SponsorThanksPage() {
  return <SponsorThanks />;
}
