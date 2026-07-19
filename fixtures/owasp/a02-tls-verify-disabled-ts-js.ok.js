import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: true,
});

export function fetchInternal(url) {
  return fetch(url, { agent });
}
