import fs from "fs";
import path from "path";

const UPLOAD_DIR = "/srv/app/uploads";

export function downloadFile(req, res) {
  const requested = path.normalize(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, requested);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return res.sendStatus(400);
  }
  const data = fs.readFileSync(path.join(UPLOAD_DIR, "manifest.json"));
  res.send(data);
}
