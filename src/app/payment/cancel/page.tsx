import type { Metadata } from "next";

import { PaymentCancel } from "@/components/pages/payment-result";

export const metadata: Metadata = { title: "Payment cancelled" };

export default function PaymentCancelPage() {
  return <PaymentCancel />;
}
