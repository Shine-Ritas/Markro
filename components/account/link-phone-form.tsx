"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkPhoneFormProps = {
  phoneVerified: boolean;
  currentPhone: string | null;
  onLinked?: () => void;
};

export function LinkPhoneForm({
  phoneVerified,
  currentPhone,
  onLinked,
}: LinkPhoneFormProps) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleRequest() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to send code");
        return;
      }
      setStep("sent");
      if (json.code) setDevCode(json.code);
      toast.success("Verification code sent");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", phone, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }
      toast.success(
        json.linkedCount > 0
          ? `Phone verified! Linked ${json.linkedCount} purchase histories.`
          : "Phone verified!"
      );
      onLinked?.();
    } finally {
      setLoading(false);
    }
  }

  if (phoneVerified && currentPhone) {
    return (
      <p className="text-sm text-muted-foreground">
        Verified phone:{" "}
        <span className="font-medium text-foreground">{currentPhone}</span>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="link-phone">Phone number</Label>
        <Input
          id="link-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+66 8x xxx xxxx"
          disabled={step === "sent"}
        />
      </div>
      {step === "sent" ? (
        <div className="space-y-2">
          <Label htmlFor="link-code">Verification code</Label>
          <Input
            id="link-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
          />
          {devCode ? (
            <p className="text-xs text-muted-foreground">Dev code: {devCode}</p>
          ) : null}
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={loading || !phone.trim()}
        onClick={step === "sent" ? handleConfirm : handleRequest}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {step === "sent" ? "Verify & link history" : "Send verification code"}
      </Button>
    </div>
  );
}
