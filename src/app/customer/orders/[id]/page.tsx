import { notFound } from "next/navigation";
import OrderDetailClient from "./order-detail-client";
import {
  getCustomerOrderById,
  requireCustomerSession,
} from "@/lib/customer-orders";

export const dynamic = "force-dynamic";

export default async function CustomerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;

  const { supabase, profile } = await requireCustomerSession(
    `/customer/orders/${id}`
  );
  const order = await getCustomerOrderById(supabase, profile, id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} autoPrint={print === "1"} />;
}

