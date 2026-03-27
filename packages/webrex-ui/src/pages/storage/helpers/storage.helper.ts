// IMPORTANT!!!!
// In this file are stored the scripts that will be remotely execute in proxied app,
// hence why they are in string template format

export const getSessionStorageKeysScript = /*ts*/ `
Array.from({ length: sessionStorage.length }, (_, i) => i)
  .map((i) => sessionStorage.key(i))
  .filter((i) => i !== null);
`;

export const getLocalStorageKeysScript = /*ts*/ `
Array.from({ length: localStorage.length }, (_, i) => i)
  .map((i) => localStorage.key(i))
  .filter((i) => i !== null);
`;

export const getSessionStorageValueScript = (key: string) => /*ts*/ `
sessionStorage.getItem("${key}")
`;

export const getLocalStorageValueScript = (key: string) => /*ts*/ `
localStorage.getItem("${key}")
`;

export const setSessionStorageValueScript = (
  key: string,
  value: string
) => /*ts*/ `
sessionStorage.setItem("${key}", ${value})
`;

export const setLocalStorageValueScript = (
  key: string,
  value: string
) => /*ts*/ `
localStorage.setItem("${key}", ${value})
`;
