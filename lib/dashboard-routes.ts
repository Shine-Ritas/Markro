const DRAW_SESSION_RE = /^\/dashboard\/events\/[^/]+\/draw\/?$/;

export function isDrawSessionRoute(pathname: string): boolean {
  return DRAW_SESSION_RE.test(pathname);
}
