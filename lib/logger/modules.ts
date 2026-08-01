/** Canonical module names for structured logging. */
export const LogModules = {
  auth: "auth",
  api: {
    events: "api.events",
    customers: "api.customers",
    draws: "api.draws",
    prizes: "api.prizes",
    tickets: "api.tickets",
    pos: "api.pos",
    me: "api.me",
    auth: "api.auth",
    uploads: "api.uploads",
    winners: "api.winners",
    ticketDesigns: "api.ticket-designs",
  },
  services: {
    imageUpload: "services.image-upload",
  },
} as const;
