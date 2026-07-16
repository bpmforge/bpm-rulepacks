import multer from "multer";

const upload = multer({ dest: "uploads/" });

export const uploadRoute = upload.single("avatar");
