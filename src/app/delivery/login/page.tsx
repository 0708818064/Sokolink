import { redirect } from "next/navigation";

export default function DeliveryLoginRedirect() {
  redirect("/rider/login");
}
