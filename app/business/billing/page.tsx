import { permanentRedirect } from "next/navigation";

export default function BusinessBillingRedirectPage() {
    permanentRedirect("/business/subscription");
}
