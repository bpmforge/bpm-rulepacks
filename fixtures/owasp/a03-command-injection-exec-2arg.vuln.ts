import { exec } from "child_process";
import type { Request, Response } from "express";

export function listDir(req: Request, res: Response) {
  exec(`ls ${req.query.dir}`, (err, out) => {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.send(out);
  });
}
