type BrowserStorageKind = "local" | "session";

export function getBrowserStorage(kind: BrowserStorageKind): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch (error) {
    console.warn(`Could not access ${kind}Storage:`, error);
    return null;
  }
}

export function safeGetStorageItem(kind: BrowserStorageKind, key: string) {
  const storage = getBrowserStorage(kind);
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Could not read ${kind}Storage item "${key}":`, error);
    return null;
  }
}

export function safeSetStorageItem(kind: BrowserStorageKind, key: string, value: string) {
  const storage = getBrowserStorage(kind);
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Could not write ${kind}Storage item "${key}":`, error);
    return false;
  }
}

export function safeRemoveStorageItem(kind: BrowserStorageKind, key: string) {
  const storage = getBrowserStorage(kind);
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Could not remove ${kind}Storage item "${key}":`, error);
    return false;
  }
}

export function isStorageEventFor(kind: BrowserStorageKind, event: StorageEvent, key: string) {
  if (event.key !== key) {
    return false;
  }

  const storage = getBrowserStorage(kind);
  return !storage || event.storageArea === storage;
}
