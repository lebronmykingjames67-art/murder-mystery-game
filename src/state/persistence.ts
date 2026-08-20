export const SAVE_STORAGE_KEY = 'grand-meridian-save-v1';

export function hasSaveGame(): boolean {
  try {
    return localStorage.getItem(SAVE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSaveGame(): void {
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore — storage may be unavailable (private browsing, etc.)
  }
}
