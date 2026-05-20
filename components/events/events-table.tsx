"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Archive, Globe } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate } from "@/lib/format";
import type { EventListItem } from "@/types/events";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EventsTableProps = {
  events: EventListItem[];
  tenantSlug?: string;
  onPublish?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function EventsTable({
  events,
  tenantSlug,
  onPublish,
  onArchive,
  onDelete,
}: EventsTableProps) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead className="text-right">Tickets</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {event.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(event.startDate)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {event.venue ?? "—"}
                </TableCell>
                <TableCell className="text-right">{event.ticketQuantity}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="size-8" />}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`/dashboard/events/${event.id}/edit`}
                              className="flex items-center gap-2"
                            />
                          }
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        {event.status === "PUBLISHED" && tenantSlug ? (
                          <DropdownMenuItem
                            render={
                              <a
                                href={`/org/${tenantSlug}/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              />
                            }
                          >
                            <Globe className="size-4" />
                            View public page
                          </DropdownMenuItem>
                        ) : null}
                        {event.status === "DRAFT" && onPublish ? (
                          <DropdownMenuItem onClick={() => onPublish(event.id)}>
                            <Globe className="size-4" />
                            Publish
                          </DropdownMenuItem>
                        ) : null}
                        {event.status !== "ARCHIVED" && onArchive ? (
                          <DropdownMenuItem onClick={() => onArchive(event.id)}>
                            <Archive className="size-4" />
                            Archive
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                      {onDelete ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(event.id)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
