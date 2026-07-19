import child_process from "child_process";

export function pingHost(host) {
  child_process.exec(`ping -c 1 ${host}`);
}
