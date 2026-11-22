import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderDetailClient from "./order-detail-client";
import {
  getCustomerOrderById,
  getGuestOrderByToken,
  type CustomerOrderDTO,
} from "@/lib/customer-orders";

export const dynamic = "force-dynamic";

export default async function CustomerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string; token?: string }>;
}) {
  const { id } = await params;
  const { print, token } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let order: CustomerOrderDTO | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      redirect("/dashboard");
    }

    if (profile) {
      order = await getCustomerOrderById(supabase, profile, id);
    }
  }

  // Jika belum ditemukan dan terdapat token pelacakan (Guest Checkout)
  if (!order && token) {
    order = await getGuestOrderByToken(supabase, id, token);
  }

  if (!order) {
    if (!user) {
      const redirectTarget = token
        ? `/customer/orders/${id}?token=${encodeURIComponent(token)}`
        : `/customer/orders/${id}`;
      redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
    notFound();
  }

  return <OrderDetailClient order={order} autoPrint={print === "1"} />;
}

