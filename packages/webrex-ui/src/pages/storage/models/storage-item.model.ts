export type StorageItem = {
  key: string;
  value: string;
  storageType: 'sessionStorage' | 'localStorage';
  /** this is mandatory, even if it's a dumb random value, because it's needed track in for loops */
  id: string;
};
