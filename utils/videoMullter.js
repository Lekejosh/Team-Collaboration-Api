const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".mp4" && ext !== ".mov" && ext !== ".avi") {
      cb(new Error("Only video files are allowed"));
    }
    cb(null, true);
  },
});
