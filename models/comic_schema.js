const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
    title: {type: String},
    img: [{ type: String }] , //validate: [arrayLimit, '{PATH} exceeds the limit of 10'], //keeps address to img stored in server, notice it is an array so you can store multiple addresses
});

const comicSchema = new mongoose.Schema({
    posterid: { type: String , required: true }, //this might not work depending on how the data is sent to server
    title: { type: String , required: true },
    likes: { type: Number },
    chapter: [ chapterSchema ],
    synopsis: { type: String , required: true },
});

//supposedly when used with validate will refuse to push new values if array exceeds limit
function arrayLimit(val) {
    return val.length <= 10;
}

const comic = mongoose.model("comic", comicSchema);
module.exports = comic;