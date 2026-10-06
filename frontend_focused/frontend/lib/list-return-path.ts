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

export function listReturnPath() {
  try {
    const queryString = window.sessionStorage.getItem(STORAGE_KEY);
    return queryString ? `${LIST_PATH}?${queryString}` : LIST_PATH;
  } catch {
    return LIST_PATH;
  }
}
