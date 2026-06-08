const express = require("express");
const router = express.Router();
const user = require("../models/user_schema.js");
let fs = require('fs');
let fse = require('fs-extra');
let mv = require("mv");

module.exports = router;

//multer is needed for uploading files to server
const multer = require("multer");

//config storage for multer(so we can name the uploaded files the way we want)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      //let path = "./public/uploads/comics/" + req.body.title + "/mainImg";
      let path = "./tmp";
      //you have to create the dir with fs-extra otherwise the folder wont be created
      fse.mkdirsSync(path);
      cb(null, path);
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
      cb(null, file.originalname);
    }
})

//const upload = multer({dest : "./uploads"});
const upload = multer({ storage: storage, 

    //below checks validates file type to be uploaded
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
        } else {
          cb(null, false);
          console.log("Only .png, .jpg and .jpeg format allowed!");
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
      }

 });