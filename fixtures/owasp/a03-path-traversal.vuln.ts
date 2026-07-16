import fs from "fs";
import path from "path";

const UPLOAD_DIR = "/srv/app/uploads";

export function downloadFile(req, res) {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  const data = fs.readFileSync(filePath);
  res.send(data);
}
