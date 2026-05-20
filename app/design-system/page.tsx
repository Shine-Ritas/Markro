"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";

const tableRows = [
  { id: "LD-001", event: "Grand Raffle 2026", tickets: 1200, status: "Active" },
  { id: "LD-002", event: "Charity Draw", tickets: 450, status: "Draft" },
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Phase 1 · UI primitives</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {APP_NAME} Design System
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-medium">Buttons & badges</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </motion.section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Form inputs</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sample form</CardTitle>
              <CardDescription>Input and label primitives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@organization.com" />
              </div>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Tabs</h2>
          <Tabs defaultValue="overview" className="max-w-lg">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="draws">Draws</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted-foreground">
              Dashboard overview placeholder.
            </TabsContent>
            <TabsContent value="tickets" className="text-sm text-muted-foreground">
              Ticket management placeholder.
            </TabsContent>
            <TabsContent value="draws" className="text-sm text-muted-foreground">
              Lucky draw engine placeholder.
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Table</h2>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell>{row.event}</TableCell>
                      <TableCell>{row.tickets}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === "Active" ? "default" : "secondary"}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Overlays</h2>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Open modal
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modal dialog</DialogTitle>
                  <DialogDescription>
                    Reusable modal for confirmations and forms.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>
                Open drawer
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Drawer / sheet</SheetTitle>
                  <SheetDescription>
                    Side panel for filters, POS cart, and quick actions.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Dropdown
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="secondary"
              onClick={() => toast.success("Toast notification works")}
            >
              Show toast
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Skeleton loading</h2>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </section>

        <Separator />

        <p className="pb-8 text-center text-sm text-muted-foreground">
          Phase 1 complete — proceed to Phase 2 for database and authentication.
        </p>
      </main>
    </div>
  );
}
