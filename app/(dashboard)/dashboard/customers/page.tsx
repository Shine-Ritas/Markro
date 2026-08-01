import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomersListClient } from "@/components/customers/customers-list-client";
import { listTenantCustomers } from "@/services/customer.service";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const data = await listTenantCustomers(session.user.tenantId, {
    limit: 50,
    offset: 0,
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Customers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage buyer profiles, purchase history, loyalty, and blacklist status.
        </p>
      </div>

      <CustomersListClient initialData={data} />
    </div>
  );
}
