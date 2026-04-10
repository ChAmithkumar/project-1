const router = require("express").Router();
const Video = require("../models/Video");
const auth = require("../middleware/auth");

const multer = require("multer");

// MULTER SETUP (inside same file to avoid path issues)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// UPLOAD VIDEO
router.post(
  "/",
  auth,
  upload.fields([{ name: "video", maxCount: 1 }]),
  async (req, res) => {
    try {
      console.log("FILES:", req.files); // debug

      if (!req.files || !req.files.video) {
        return res.status(400).json({ msg: "Video file missing" });
      }

      const videoFile = req.files.video[0];

      const video = await Video.create({
        title: req.body.title,
        description: req.body.description,
        videoUrl: "/uploads/" + videoFile.filename,
        author: req.user.id
      });

      res.json(video);

    } catch (err) {
      console.error("UPLOAD ERROR 👉", err);
      res.status(500).json({ msg: "Upload failed", error: err.message });
    }
  }
);

// GET VIDEOS
router.get("/", async (req, res) => {
  const v = await Video.find().populate("author", "username");
  res.json(v);
});


// DELETE VIDEO
router.delete("/:id", auth, async (req, res) => {
  try {
    const v = await Video.findById(req.params.id);

    if (!v) return res.status(404).json({ msg: "Video not found" });

    // only owner can delete
    if (v.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    await v.deleteOne();

    res.json({ msg: "Deleted" });

  } catch (err) {
    res.status(500).json({ msg: "Delete failed" });
  }
});


//update video
router.put("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) return res.status(404).json({ msg: "Not found" });

    // only author can edit
    if (video.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const updated = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
});
module.exports = router;



