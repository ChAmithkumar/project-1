const mongoose = require("mongoose");

const schema = new mongoose.Schema({
 text:String,
 user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
 video:{type:mongoose.Schema.Types.ObjectId,ref:"Video"}
});

module.exports = mongoose.model("Comment", schema);