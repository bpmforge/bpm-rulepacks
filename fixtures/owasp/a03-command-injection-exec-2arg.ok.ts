import { exec, execFile } from "child_process";
import type { Request, Response } from "express";

export function listDir(req: Request, res: Response) {
  exec("ls -la", (err, out) => {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.send(out);
  });
}

export function listDirSafe(req: Request, res: Response) {
  execFile("ls", ["-la", String(req.query.dir)], (err, out) => {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.send(out);
  });
}
