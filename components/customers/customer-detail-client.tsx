"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Loader2,
  MessageSquarePlus,
  Save,
  Trophy,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import type {
  CustomerDetailDto,
  CustomerNoteDto,
  CustomerParticipationDto,
  CustomerPurchaseDto,
  CustomerTimelineEvent,
  ReferralDto,
} from "@/types/customers";
import { CUSTOMER_SOURCE_LABELS, REFERRAL_STATUS_LABELS } from "@/types/customers";
import type { GlobalUserLookupResult } from "@/types/customers";
import { GlobalUserSearch } from "@/components/customers/global-user-search";

type CustomerDetailClientProps = {
  initialCustomer: CustomerDetailDto;
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function CustomerDetailClient({ initialCustomer }: CustomerDetailClientProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initialCustomer);
  const [displayName, setDisplayName] = useState(customer.displayName);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? "");
  const [saving, setSaving] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState(
    customer.blacklistReason ?? ""
  );
  const [notes, setNotes] = useState<CustomerNoteDto[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [purchases, setPurchases] = useState<CustomerPurchaseDto[]>([]);
  const [participation, setParticipation] = useState<CustomerParticipationDto[]>([]);
  const [referrals, setReferrals] = useState<ReferralDto[]>([]);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [referralPhone, setReferralPhone] = useState("");
  const [loadingTab, setLoadingTab] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadTabData = useCallback(async () => {
    setLoadingTab(true);
    try {
      const [notesRes, purchasesRes, participationRes, referralsRes, timelineRes] =
        await Promise.all([
          fetch(`/api/customers/${customer.id}/notes`),
          fetch(`/api/customers/${customer.id}/purchases`),
          fetch(`/api/customers/${customer.id}/participation`),
          fetch(`/api/customers/${customer.id}/referrals`),
          fetch(`/api/customers/${customer.id}/timeline`),
        ]);
      if (notesRes.ok) setNotes((await notesRes.json()).notes);
      if (purchasesRes.ok) setPurchases((await purchasesRes.json()).purchases);
      if (participationRes.ok)
        setParticipation((await participationRes.json()).participation);
      if (referralsRes.ok) setReferrals((await referralsRes.json()).referrals);
      if (timelineRes.ok) setTimeline((await timelineRes.json()).timeline);
    } finally {
      setLoadingTab(false);
    }
  }, [customer.id]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, phone, email: email || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update");
        return;
      }
      setCustomer((c) => ({ ...c, ...json.customer }));
      toast.success("Profile updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleBlacklist(isBlacklisted: boolean) {
    const res = await fetch(`/api/customers/${customer.id}/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isBlacklisted,
        reason: isBlacklisted ? blacklistReason : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update blacklist");
      return;
    }
    setCustomer((c) => ({ ...c, ...json.customer }));
    toast.success(isBlacklisted ? "Customer blacklisted" : "Customer unblacklisted");
    loadTabData();
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    const res = await fetch(`/api/customers/${customer.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to add note");
      return;
    }
    setNotes((prev) => [json.note, ...prev]);
    setNoteBody("");
    toast.success("Note added");
    loadTabData();
  }

  async function handleAddReferral() {
    if (!referralPhone.trim()) return;
    const res = await fetch(`/api/customers/${customer.id}/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referredPhone: referralPhone }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to create referral");
      return;
    }
    setReferrals((prev) => [json.referral, ...prev]);
    setReferralPhone("");
    toast.success("Referral recorded");
    loadTabData();
  }

  async function handleLinkUser(user: GlobalUserLookupResult) {
    setLinking(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/link-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to link account");
        return;
      }
      setCustomer((c) => ({ ...c, ...json.customer }));
      toast.success("Global account linked");
      router.refresh();
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <UserCircle className="size-7 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-bold">
                {customer.displayName}
              </h2>
              {customer.isBlacklisted ? (
                <Badge variant="destructive">Blacklisted</Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Referral code: <code className="font-mono">{customer.referralCode}</code>{" "}
              · {CUSTOMER_SOURCE_LABELS[customer.source]}
            </p>
            {customer.globalUserCode ? (
              <p className="mt-1 text-xs">
                <Badge variant="secondary" className="font-mono">
                  {customer.globalUserCode}
                </Badge>
                {customer.linkedUserEmail ? (
                  <span className="ml-2 text-muted-foreground">
                    {customer.linkedUserEmail}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
          <div>
            <p className="text-2xl font-bold">{customer.loyaltyPoints}</p>
            <p className="text-xs text-muted-foreground">Loyalty pts</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{customer.purchaseCount}</p>
            <p className="text-xs text-muted-foreground">Purchases</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{customer.winCount}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold">Contact</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save profile
            </Button>
          </section>

          {!customer.userId ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold">Link global account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect this customer to a buyer&apos;s global account by code or email.
              </p>
              <div className="mt-4">
                <GlobalUserSearch
                  selected={null}
                  onSelect={(user) => {
                    if (user) void handleLinkUser(user);
                  }}
                  label="Search global account"
                />
                {linking ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Linking…
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold">Blacklist</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Blacklisted customers cannot complete POS purchases.
            </p>
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Reason (optional)"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                {customer.isBlacklisted ? (
                  <Button variant="outline" onClick={() => handleBlacklist(false)}>
                    <Check className="size-4" />
                    Remove blacklist
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => handleBlacklist(true)}>
                    <Ban className="size-4" />
                    Blacklist customer
                  </Button>
                )}
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6">
          {loadingTab ? (
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          ) : purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-sm">
                        {purchase.receiptNumber ?? "—"}
                      </TableCell>
                      <TableCell>{purchase.eventName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {purchase.ticketNumbers.map((n) => `#${n}`).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>{formatMoney(purchase.totalCents)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {purchase.completedAt
                          ? formatDateTime(purchase.completedAt)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="participation" className="mt-6 space-y-4">
          {loadingTab ? (
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          ) : participation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No event participation yet.</p>
          ) : (
            participation.map((event) => (
              <div
                key={event.eventId}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-heading font-semibold">{event.eventName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.ticketCount} ticket{event.ticketCount === 1 ? "" : "s"}:{" "}
                  {event.ticketNumbers.map((n) => `#${n}`).join(", ")}
                </p>
                {event.wins.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {event.wins.map((win) => (
                      <li
                        key={`${win.ticketNumber}-${win.rank}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Trophy className="size-4 text-amber-400" />
                        {rankLabel(win.rank)} — #{win.ticketNumber}
                        {win.prizeName ? ` · ${win.prizeName}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="referrals" className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Referred phone number"
              value={referralPhone}
              onChange={(e) => setReferralPhone(e.target.value)}
            />
            <Button onClick={handleAddReferral} disabled={!referralPhone.trim()}>
              Add referral
            </Button>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals recorded.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{referral.referredPhone ?? "—"}</TableCell>
                      <TableCell>{referral.referredCustomerName ?? "—"}</TableCell>
                      <TableCell>{REFERRAL_STATUS_LABELS[referral.status]}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(referral.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a staff note…"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={!noteBody.trim()}>
              <MessageSquarePlus className="size-4" />
              Add
            </Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="text-sm">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.authorName ?? "Staff"} · {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          {loadingTab ? (
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((event) => (
                <li
                  key={`${event.type}-${event.id}`}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <TimelineItem event={event} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(event.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimelineItem({ event }: { event: CustomerTimelineEvent }) {
  switch (event.type) {
    case "SALE_COMPLETED":
      return (
        <p className="text-sm">
          <span className="font-medium">Purchase</span> — {event.eventName} ·{" "}
          {event.ticketCount} ticket{event.ticketCount === 1 ? "" : "s"} ·{" "}
          {formatMoney(event.totalCents)}
          {event.receiptNumber ? ` · #${event.receiptNumber}` : ""}
        </p>
      );
    case "TICKET_WON":
      return (
        <p className="text-sm">
          <span className="font-medium">Won {rankLabel(event.rank)}</span> —{" "}
          {event.eventName} · #{event.ticketNumber}
          {event.prizeName ? ` · ${event.prizeName}` : ""}
        </p>
      );
    case "NOTE_ADDED":
      return (
        <p className="text-sm">
          <span className="font-medium">Note</span> by {event.authorName ?? "Staff"}:{" "}
          {event.body}
        </p>
      );
    case "REFERRAL_CREATED":
      return (
        <p className="text-sm">
          <span className="font-medium">Referral</span> —{" "}
          {event.referredPhone ?? "unknown"} · {REFERRAL_STATUS_LABELS[event.status]}
        </p>
      );
    case "BLACKLIST_UPDATED":
      return (
        <p className="text-sm">
          <span className="font-medium">
            {event.isBlacklisted ? "Blacklisted" : "Removed from blacklist"}
          </span>
          {event.reason ? ` — ${event.reason}` : ""}
        </p>
      );
    default:
      return null;
  }
}
