import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export function fetchInternal(url: string) {
  return fetch(url, { agent });
}
