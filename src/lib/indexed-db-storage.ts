/**
 * Tiny IndexedDB key-value store for files (Blobs).
 * localStorage is limited to ~5 MB of strings, so uploaded documents are kept
 * here in the demo. TODO (backend phase): upload to the server instead.
 */

const DB_NAME = "edumanage-files";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export function putFile(key: string, file: Blob) {
  return run("readwrite", (store) => store.put(file, key));
}

export function getFile(key: string) {
  return run<Blob | undefined>("readonly", (store) => store.get(key));
}

export function deleteFile(key: string) {
  return run("readwrite", (store) => store.delete(key));
}
