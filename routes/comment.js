const router = require("express").Router();
const Comment = require("../models/Comment");
const auth = require("../middleware/auth");

router.post("/:id", auth, async(req,res)=>{
 const c = await Comment.create({
  text:req.body.text,
  user:req.user.id,
  video:req.params.id
 });
 res.json(c);
});

router.get("/:id", async(req,res)=>{
 const c = await Comment.find({video:req.params.id}).populate("user","username");
 res.json(c);
});

module.exports = router;