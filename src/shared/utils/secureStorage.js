import CryptoJS from "crypto-js";

const SECRET = import.meta.env.VITE_STORAGE_SECRET || "pln-secret-key-2024";
const PREFIX = "pln_";

export function setSecureItem(key, value) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(value),
    SECRET,
  ).toString();
  localStorage.setItem(PREFIX + key, encrypted);
}

export function getSecureItem(key) {
  try {
    const encrypted = localStorage.getItem(PREFIX + key);
    if (!encrypted) return null;
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
}

export function removeSecureItem(key) {
  localStorage.removeItem(PREFIX + key);
}

export function clearSecureStorage() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
