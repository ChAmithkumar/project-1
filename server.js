require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Video = require("./models/Video");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* ================= ROOT ================= */ 
app.get("/", (req, res) => {
    res.send("Blogging API Running 🚀");
});

app.put("/videos/like/:id", async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Error liking video" });
  }
});

app.post("/videos/comment/:id", async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: req.body.comment } },
      { new: true }
    );

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

const path = require("path");


app.put("/videos/view/:id", async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Error updating views" });
  }
});


// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/video", require("./routes/video"));
app.use("/api/comment", require("./routes/comment"));

app.listen(5000, ()=>console.log("Server running on http://localhost:5000"));