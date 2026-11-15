import CustomerDashboardClient from "./customer-dashboard-client";
import {
  getCustomerOrders,
  requireCustomerSession,
} from "@/lib/customer-orders";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const { supabase, email, profile } = await requireCustomerSession(
    "/customer/dashboard"
  );
  const orders = await getCustomerOrders(supabase, profile);

  return (
    <CustomerDashboardClient
      profile={{
        id: profile.id,
        fullName: profile.full_name || "Pelanggan BannerIN",
        phone: profile.phone || "",
        email,
      }}
      initialOrders={orders}
    />
  );
}
