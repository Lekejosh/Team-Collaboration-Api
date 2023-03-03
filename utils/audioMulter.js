const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".mp3" && ext !== ".wav" && ext !== ".ogg"&& ext !== ".mpa") {
      cb(new Error("Only audio files are allowed"));
    }
    cb(null, true);
  },
});
