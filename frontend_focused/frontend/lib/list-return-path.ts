const STORAGE_KEY = 'submissions:list-query';
const LIST_PATH = '/submissions';

/** Remembers the list's query string so "back to submissions" restores the same view. */
export function rememberListQuery(queryString: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, queryString);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the plain list still works.
  }
}

/** The list's last query string, or an empty string for the default list. */
export function rememberedListQuery() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function listReturnPath() {
  const queryString = rememberedListQuery();
  return queryString ? `${LIST_PATH}?${queryString}` : LIST_PATH;
}
