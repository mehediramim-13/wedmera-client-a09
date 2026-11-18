import type { Metadata } from "next";

import { PaymentSuccess } from "@/components/pages/payment-result";

export const metadata: Metadata = { title: "Payment received" };

export default function PaymentSuccessPage() {
  return <PaymentSuccess />;
}
