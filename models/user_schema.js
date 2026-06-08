const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  chapterTitle: {type: String , required:true},
  pageImg: [{ type: String }] , //validate: [arrayLimit, '{PATH} exceeds the limit of 10'], //keeps address to img stored in server, notice it is an array so you can store multiple addresses
});

const comicSchema = new mongoose.Schema({
  //posterid: { type: String , required: true }, //this might not work depending on how the data is sent to server
  title: { type: String , required: true },
  synopsis: { type: String , required: true },
  likes: { type: Number },
  mainImg: {type:String},
  chapters: [ chapterSchema ],
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  comics:[comicSchema],
  liked: [{type:String}]
  //likedcomicsid: [{type: String}], //this will accept comics id, used to know which comics user has already liked (liked comics can not be liked twice)
});

const user = mongoose.model("user", userSchema);
module.exports = user;