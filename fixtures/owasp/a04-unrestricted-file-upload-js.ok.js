import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === "image/png");
  },
});

export const uploadRoute = upload.single("avatar");
