import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export function fetchInternal(url) {
  return fetch(url, { agent });
}
