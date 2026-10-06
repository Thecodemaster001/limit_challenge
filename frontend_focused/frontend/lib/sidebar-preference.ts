export const SIDEBAR_COLLAPSED_COOKIE = 'sidebar-collapsed';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Saved in a cookie rather than localStorage so the server can render the sidebar in the
 * chosen state, instead of rendering it open and snapping it shut after hydration.
 */
export function saveSidebarCollapsed(isCollapsed: boolean) {
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${isCollapsed}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
}
