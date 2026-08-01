"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/tickets";
import type { PrizeDto } from "@/types/prizes";

type PrizesListClientProps = {
  initialPrizes: PrizeDto[];
};

type FormState = {
  name: string;
  description: string;
  imageUrl: string;
  valueCents: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  imageUrl: "",
  valueCents: "",
  isActive: true,
};

export function PrizesListClient({ initialPrizes }: PrizesListClientProps) {
  const router = useRouter();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PrizeDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(prize: PrizeDto) {
    setEditing(prize);
    setForm({
      name: prize.name,
      description: prize.description ?? "",
      imageUrl: prize.imageUrl ?? "",
      valueCents: prize.valueCents != null ? String(prize.valueCents / 100) : "",
      isActive: prize.isActive,
    });
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        valueCents: form.valueCents
          ? Math.round(parseFloat(form.valueCents) * 100)
          : null,
        isActive: form.isActive,
      };

      const res = await fetch(editing ? `/api/prizes/${editing.id}` : "/api/prizes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save prize");
        return;
      }

      toast.success(editing ? "Prize updated" : "Prize created");
      setOpen(false);
      router.refresh();
      if (editing) {
        setPrizes((prev) => prev.map((p) => (p.id === data.prize.id ? data.prize : p)));
      } else {
        setPrizes((prev) => [...prev, data.prize]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(prize: PrizeDto) {
    if (!confirm(`Delete prize "${prize.name}"?`)) return;
    const res = await fetch(`/api/prizes/${prize.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to delete");
      return;
    }
    toast.success("Prize deleted");
    setPrizes((prev) => prev.filter((p) => p.id !== prize.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add prize
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prize</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-muted-foreground"
                >
                  <Gift className="mx-auto mb-2 size-8 opacity-40" />
                  No prizes yet. Add prizes to assign them to events.
                </TableCell>
              </TableRow>
            ) : (
              prizes.map((prize) => (
                <TableRow key={prize.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {prize.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prize.imageUrl}
                          alt=""
                          className="size-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                          <Gift className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{prize.name}</p>
                        {prize.description ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {prize.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {prize.valueCents != null
                      ? formatMoney(prize.valueCents, "THB")
                      : "—"}
                  </TableCell>
                  <TableCell>{prize.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(prize)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prize)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit prize" : "Add prize"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="prizeName">Name</Label>
              <Input
                id="prizeName"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prizeDesc">Description</Label>
              <Input
                id="prizeDesc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prizeImage">Image URL</Label>
              <Input
                id="prizeImage"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prizeValue">Display value (optional)</Label>
              <Input
                id="prizeValue"
                type="number"
                min={0}
                step="0.01"
                value={form.valueCents}
                onChange={(e) => setForm((f) => ({ ...f, valueCents: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active in catalog
            </label>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save prize
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
