import child_process from "child_process";

export function pingHost(host: string) {
  child_process.execFile("ping", ["-c", "1", host]);
}
