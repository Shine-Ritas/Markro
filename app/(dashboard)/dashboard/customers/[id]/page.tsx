import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomerDetailClient } from "@/components/customers/customer-detail-client";
import { getTenantCustomerById } from "@/services/customer.service";

type PageProps = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const customer = await getTenantCustomerById(session.user.tenantId, id);
  if (!customer) notFound();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <CustomerDetailClient initialCustomer={customer} />
    </div>
  );
}
