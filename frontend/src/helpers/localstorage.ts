export function setItemInLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getItemFromLocalStorage(key: string) {
  const item = localStorage.getItem(key);
  if (!item) return null;
  return item;
}

export function getParseLocalStorageItem(key: string) {
  const item = getItemFromLocalStorage(key);
  if (!item) return item;
  const parsedItem = JSON.parse(item);
  return parsedItem;
}
