const mongoose = require("mongoose");

const schema = new mongoose.Schema({
 title:String,
 description:String,
 videoUrl:String,
 thumbnail:String,
 likes:{type:Number,default:0},
 comments: { type: [String], default: [] },
 userId:String,
 views:{type:Number,default:0},
 author:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});

module.exports = mongoose.model("Video", schema);