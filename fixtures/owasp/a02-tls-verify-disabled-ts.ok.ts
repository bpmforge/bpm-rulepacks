import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: true,
});

export function fetchInternal(url: string) {
  return fetch(url, { agent });
}
