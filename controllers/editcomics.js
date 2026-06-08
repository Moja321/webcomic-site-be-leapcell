const express = require("express");
const router = express.Router();
const user = require("../models/user_schema.js");
let fs = require('fs');
let fse = require('fs-extra');
let mv = require("mv");
const mongoose = require("mongoose");
// const { default: mongoose } = require("mongoose");

//To allow the serving of static files (like images)

//multer is needed for uploading files to server
const multer = require("multer");

//normal functions
const findComic = (comicsarr,comicid) => {
    var comic;
    for (i=0;i<comicsarr.length;i++){
        if (comicsarr[i]["_id"] == comicid){
            console.log("comic id matched!");
            comic = comicsarr[i];
        } else {
            console.log("no comic matched!");
        }
    }

    return comic;
}

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
      cb(null, Date.now() + '-' + file.originalname);
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

// custom middleware
const postComic = (req,res,next) => {
    //postComic code
}

router.get("/",(req,res)=>{
    // res.send("User list");
    res.render("index", {text: "comics"});
})

router.get("/:id/edit",(req,res)=>{

    console.log("START OF GET EDIT PAGE ROUTE:");

    //you might need a guard clause here to check if user associated with this comic is logged in (because only the user should have access)
    console.log("id :" + req.params.id);

    //we need mongodb code here to get individual comic data from server and pass to res.render
    //actually we probably can just grab this from the user session object since only the user can edit data anyway
    
    const comicsArr = req.session.user["comics"];
    var comic;

    //somehow comicsArr[i]["_id"] turned its typing into a string at this point, normally it would be an object, which is why strict comparison is working
    //console.log("comicsArr[4][\"_id\"] type is : " + typeof(comicsArr[4]["_id"]));
    //console.log("req.params.id type is : " + typeof(req.params.id));

    for (i=0;i<comicsArr.length;i++){
        if (comicsArr[i]["_id"] === req.params.id){
            console.log("comic id matched!");
            comic = comicsArr[i];
        }
    }

    console.log("comic for edit is = " + comic);
    console.log(comic["mainImg"]);
    //console.log("chapters is: " + comic["chapters"][0]["chapterTitle"]);

    //need to add another object to pass to comic_editpage.ejs, the comic chapters object
    //res.render("comic_editpage.ejs",{editComic: comic});

    if(req.session.user){
        res.render("comic_editpage.ejs",{editComic: comic,  loggedInUser: (req.session.user["username"]) || "none" });
    }else{
        res.render("comic_editpage.ejs",{editComic: comic});
    }
})

router.post("/",upload.single('comicImg'),(req,res)=>{
//router.post("/", (req,res)=>{

    console.log("starting /comics post http request:")
    console.log(req.file);
    console.log(req.file.filename);
    var mainImgPath = req.file.path;
    console.log("mainImgPath :" + mainImgPath);

    //We have to use promises instead:
    // user.create(req.body).then((result)=>{
    //     console.log(result);
    //     res.render("username", {fruits: result.username});
    // }).catch((error)=>{
    //     console.log(error);
    // });

    //const comicModel = new 
    //user.comics.push

    user.findByIdAndUpdate(req.session.user["_id"], {
        "$push": {
          "comics": {
            
              "title": req.body.title,
              "synopsis": req.body.synopsis,
              "likes": 0,
              "mainImg" : ""
              //"mainImg": mainImgPath.slice(6)
            
          },
        }, 
    }, {returnDocument: 'after'}).then((result)=>{ 

    console.log("the id of last pushed comic is:");
    console.log(result["comics"][result.comics.length-1]._id);

    var comicId = result["comics"][result.comics.length-1]._id;
    console.log("comicId is :" + comicId);

    var userId = req.session.user["_id"];
    console.log("userId is :" + userId)

    //move file from tmp to its own folder named after comic id
    //TODO : if we are going to upload our files based on object id, we may have to chain multiple mongoose queries
    //because the file upload happens before object id is created

    const currentPath = req.file.path;
    const destinationPath = "./public/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename;
    fse.mkdirsSync("./public/uploads/comics/" + comicId.toString() + "/mainImg");

    mv(currentPath, destinationPath, function(err) {
        if (err) {
            throw err
        } else {
            console.log("Successfully moved the file!");
        }
    });

    //req.file.path = "uploads/comics" + req.file.filename;


    //need to use return to chain Mongoose/Mongo queries
    return user.findOneAndUpdate({ "_id": req.session.user["_id"], "comics._id": comicId },
    { 
        "$set": {
            "comics.$.mainImg": "/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename
        }

    }, {returnDocument: 'after'})
    
    }).then((result)=>{

        console.log("updated comics in user:" + req.session.user["username"]);
        console.log("result :");
        console.log(result);
    
        console.log("current session's id: " + req.session.id);
        req.session.user = result;
        console.log("current session object: ")
        console.log(req.session.user);
        console.log("current session's id: " + req.session.id);
    
        res.render("user_editpage", {info: "Comic created succesfully!", loggedInUser: req.session.user["username"], userComics: req.session.user["comics"]});
        

    }).catch((error)=>{
    console.log(error);
    });

    //returnDocument:'after' returns the updated MongoDB document as a result
})

//we need to use multer upload this way to handle multer limit exceed error:
const uploadChapters = upload.array("chapterImg",10);

//router.post("/edit-chapters/:id", upload.array("chapterImg[]",2),(req,res) => {

router.post("/edit-chapters/:id", (req,res) => {  
    
    uploadChapters(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.log("A Multer error occurred when uploading : " + err.message);
            //var errMulter = "A Multer error occurred when uploading : " + err.message;
            var errMulter = "Image uploads exceeded maximum amount";

            //grab only the spesific comic as an object from return result
            const comicsArr = req.session.user["comics"];
            const comicId = req.params.id;

            var comic = findComic(comicsArr,comicId);

            console.log("comic for edit is = " + comic);

            res.render("comic_editpage.ejs",{editComic: comic, errorMsg: errMulter});
            console.log("comic_edit.ejs has been rendered!!");
        } else if (err) {
            // An unknown error occurred when uploading.
            console.log("An unknown error occurred when uploading: " + err);
        } else {
    
        // Everything went fine.
        console.log("Everything went fine.");
    

        console.log("START OF /edit-chapters ROUTE:");
    
        console.log("req.session.user[_id] : "+ req.session.user["_id"]);
        console.log("req.params.id : "+ req.params.id);
        console.log("req.body.chapters : " + req.body.chapters);

        //console.log("req.files : " + req.files[0].filename);

        //return;
        
        //var dataarr = ["Dunno" , req.file.filename];

        //findAndUpdate mongoose comics img address

        //TODO:
        //we need to move all the files saved to its proper folder (not temp)
        //we need to push all req.files new address into dataarr

        var dataarr = [];
        for (i=0;i<req.files.length;i++){
            console.log(req.files[i].filename);
            dataarr.push(req.files[i]);
        }

        // var dataarr = [];
        // for (key in req.files){
        //     //console.log(req.files[key][0].filename);
        //     dataarr.push(req.files[key][0]);
        // }

        console.log("Length of dataarr : " + dataarr.length);

        //check that dataarr is filled correctly
        // for (i=0;i<dataarr.length;i++) {
        //     console.log(dataarr[i].path);
        // }

        const errMsg = "No images were uploaded, please provide at least 1 comic page to upload";

        if (dataarr.length === 0) {
            console.log(errMsg);

            //grab only the spesific comic as an object from return result
            const comicsArr = req.session.user["comics"];
            const comicId = req.params.id;

            var comic = findComic(comicsArr,comicId);

            console.log("comic for edit is = " + comic);

            //re-render and pass result to comic_editpage.ejs
            res.render("comic_editpage.ejs",{info: "No images were uploaded, please provide at least 1 comic page to upload", editComic: comic, errorMsg: errMsg});

            return;

        }

        //going to need a for loop to move multiple files here

        //var below should be an array of the different source path filenames (req.files[])
        //const currentPath = req.files[key][0].path;

        //console.log("currentPath : " + currentPath);

        //return;

        var comicId = req.params.id;

        //return;

        const destinationPath = "./public/uploads/comics/" + comicId + "/chapters/" + req.body.chapters;
        fse.mkdirsSync(destinationPath);

        //we need to make sure the folder is empty before every chapter images upload request
        fse.emptyDirSync(destinationPath);

        // mv(currentPath, destinationPath, function(err) {
        //     if (err) {
        //         throw err
        //     } else {
        //         console.log("Successfully moved the file!");
        //     }
        // });

        for (i=0;i<dataarr.length;i++) {
            mv(dataarr[i].path, destinationPath + "/" + dataarr[i].filename, function(err) {
                if (err) {
                    throw err
                } else {
                    console.log("Successfully moved the file!");
                }
            });
        }
        
        //return;

        var addressArr = [];
        for (i=0;i<dataarr.length;i++){
            addressArr.push("/uploads/comics/" + comicId + "/chapters/" + req.body.chapters + "/" + dataarr[i].filename);
        }

        //"/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename

        user.findOneAndUpdate( {"_id": req.session.user["_id"]},{

            "$set": {

                //below we are emptying the pageImg array with = []
                "comics.$[i].chapters.$[j].pageImg":[]

                //"comics.$[i].chapters.$[j].pageImg":{$each: addressArr}
                
                    // "comics.$.chapters" : {

                    //     "chapters.$.pageImg": {$each: dataarr}
                    // }

                    //"pageImg": req.file.filename
                    //"chapters.$.pageImg": {$each: dataarr}

            }, 

        }, 
        
        {
            arrayFilters: [{
                "i._id": req.params.id
            }, {
                "j._id": req.body.chapters
            }]
        },
        
        {returnDocument: 'after'}).then((result)=>{

            return user.findOneAndUpdate( {"_id": req.session.user["_id"]},{

                "$push": {
        
                    //"comics.$[i].chapters.$[j].pageImg":[]
                    "comics.$[i].chapters.$[j].pageImg":{$each: addressArr}
        
                }, 
        
            }, 
            
            {
                arrayFilters: [{
                    "i._id": req.params.id
                }, {
                    "j._id": req.body.chapters
                }]
            },   

        {returnDocument: 'after'})

        }).then((result)=>{

        console.log("Result of /edit chapters route is :" + result);

        //update req.session.user
        //req.session.user = results.result1;
        req.session.user = result;

        //grab only the spesific comic as an object from return result
        const comicsArr = req.session.user["comics"];

        var comic;

        for (i=0;i<comicsArr.length;i++){
            if (comicsArr[i]["_id"] == req.params.id){
                console.log("comic id matched!");
                comic = comicsArr[i];
            } else {
                console.log("no comic matched!");
            }
        }

        console.log("comic for edit is = " + comic);

        var success = "Pages uploaded/updated succesfully!";

        //re-render and pass result to comic_editpage.ejs
        if (req.session.user){
            res.render("comic_editpage.ejs",{info : "Uploaded comic pages succesfully!", loggedInUser: req.session.user["username"],editComic: comic, errorMsg: success});
        } else {
            res.render("comic_editpage.ejs",{info : "No user logged in"});
        }
        
        
        // .then((results)=>{

        //render/re-render page and pass new updated comic object

        }).catch((error)=>{
            console.log(error);
        });
        
        }
    })

});

// router.post("/edit-chapters/:id", upload.fields
// ([{name:'chapterImg1'},{name:'chapterImg2'},{name:'chapterImg3'},{name:'chapterImg4'},{name:'chapterImg5'},
// ]),(req,res) => {

//     console.log("START OF /edit-chapters ROUTE:");
    
//     console.log("req.session.user[_id] : "+ req.session.user["_id"]);
//     console.log("req.params.id : "+ req.params.id);
//     console.log("req.body.chapters : " + req.body.chapters);

//     //*take note how the req.files are formatted when using multer upload.fields:
//     //console.log("req.files : " + req.files['chapterImg1'][0]);
//     console.log("req.files : " + req.files['chapterImg1']);
    
//     //var dataarr = ["Dunno" , req.file.filename];

//     //return;

//     //findAndUpdate mongoose comics img address

//     //TODO:
//     //we need to move all the files saved to its proper folder (not temp)
//     //we need to push all req.files new address into dataarr

//     // var dataarr = [];
//     // for (i=0;i<req.files.length;i++){
//     //     console.log(req.files)
//     // }

//     var dataarr = [];
//     for (key in req.files){
//         //console.log(req.files[key][0].filename);
//         dataarr.push(req.files[key][0]);
//     }

//     console.log("Length of dataarr : " + dataarr.length);

//     //check that dataarr is filled correctly
//     // for (i=0;i<dataarr.length;i++) {
//     //     console.log(dataarr[i].path);
//     // }

//     const errMsg = "No images were uploaded, please provide at least 1 page to upload";

//     if (dataarr.length === 0) {
//         console.log(errMsg);

//         //grab only the spesific comic as an object from return result
//         const comicsArr = req.session.user["comics"];
//         const comicId = req.params.id;

//         var comic = findComic(comicsArr,comicId);

//         console.log("comic for edit is = " + comic);

//         //re-render and pass result to comic_editpage.ejs
//         res.render("comic_editpage.ejs",{editComic: comic, errorMsg: errMsg});

//         return;

//     }

//     //going to need a for loop to move multiple files here

//     //var below should be an array of the different source path filenames (req.files[])
//     //const currentPath = req.files[key][0].path;

//     //console.log("currentPath : " + currentPath);

//     //return;

//     var comicId = req.params.id;

//     //return;

//     const destinationPath = "./public/uploads/comics/" + comicId + "/chapters/" + req.body.chapters;
//     fse.mkdirsSync(destinationPath);

//     //we need to make sure the folder is empty before every chapter images upload request
//     fse.emptyDirSync(destinationPath);

//     // mv(currentPath, destinationPath, function(err) {
//     //     if (err) {
//     //         throw err
//     //     } else {
//     //         console.log("Successfully moved the file!");
//     //     }
//     // });

//     for (i=0;i<dataarr.length;i++) {
//         mv(dataarr[i].path, destinationPath + "/" + dataarr[i].filename, function(err) {
//             if (err) {
//                 throw err
//             } else {
//                 console.log("Successfully moved the file!");
//             }
//         });
//     }
    
//     //return;

//     var addressArr = [];
//     for (i=0;i<dataarr.length;i++){
//         addressArr.push("/public/uploads/comics/" + comicId + "/chapters/" + req.body.chapters + "/" + dataarr[i].filename);
//     }

//     //"/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename

//     user.findOneAndUpdate( {"_id": req.session.user["_id"]},{

//         "$set": {

//             "comics.$[i].chapters.$[j].pageImg":[]

//             //"comics.$[i].chapters.$[j].pageImg":{$each: addressArr}
              
//                 // "comics.$.chapters" : {

//                 //     "chapters.$.pageImg": {$each: dataarr}
//                 // }

//                 //"pageImg": req.file.filename
//                 //"chapters.$.pageImg": {$each: dataarr}

//         }, 

//     }, 
    
//     {
//         arrayFilters: [{
//             "i._id": req.params.id
//         }, {
//             "j._id": req.body.chapters
//         }]
//     },
    
//     {returnDocument: 'after'}).then((result)=>{

//         return user.findOneAndUpdate( {"_id": req.session.user["_id"]},{

//             "$push": {
    
//                 //"comics.$[i].chapters.$[j].pageImg":[]
//                 "comics.$[i].chapters.$[j].pageImg":{$each: addressArr}
    
//             }, 
    
//         }, 
        
//         {
//             arrayFilters: [{
//                 "i._id": req.params.id
//             }, {
//                 "j._id": req.body.chapters
//             }]
//         },   

//     {returnDocument: 'after'})

//     }).then((result)=>{

//     console.log("Result of /edit chapters route is :" + result);

//         //update req.session.user
//         //req.session.user = results.result1;
//         req.session.user = result;

//         //grab only the spesific comic as an object from return result
//         const comicsArr = req.session.user["comics"];

//         var comic;

//         for (i=0;i<comicsArr.length;i++){
//             if (comicsArr[i]["_id"] == req.params.id){
//                 console.log("comic id matched!");
//                 comic = comicsArr[i];
//             } else {
//                 console.log("no comic matched!");
//             }
//         }

//         console.log("comic for edit is = " + comic);

//         //re-render and pass result to comic_editpage.ejs
//         res.render("comic_editpage.ejs",{editComic: comic});
    
//     // .then((results)=>{

//         //render/re-render page and pass new updated comic object

//     }).catch((error)=>{
//         console.log(error);
//         });

// });

router.post("/chapters/:id", (req,res) => {
    
    console.log("START OF editcomics/chapters/:id POST ROUTE:");

    //TODO:comicId is not defined
    user.findOneAndUpdate({ "_id": req.session.user["_id"], "comics._id": req.params.id },
    { 
        // "$set": {
        //     "comics.$.mainImg": "/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename
        // }

        // "$push": {
        //     "comics": {
              
        //         "title": req.body.title,
        //         "synopsis": req.body.synopsis,
        //         "likes": 0,
        //         "mainImg" : ""
        //         //"mainImg": mainImgPath.slice(6)
              
        //     },
        //   }, 

        "$push": {
            "comics.$.chapters": {
              
                "chapterTitle": req.body.chapterTitle,
              
            },
          }, 

    }, {returnDocument: 'after'})
    
    .then((result)=>{
        console.log("Result of findOneAndUpdate is :" + result);

        //update req.session.user
        //req.session.user = results.result1;
        req.session.user = result;

        //grab only the spesific comic as an object from return result
        const comicsArr = req.session.user["comics"];

        var comic;

        for (i=0;i<comicsArr.length;i++){
            if (comicsArr[i]["_id"] == req.params.id){
                console.log("comic id matched!");
                comic = comicsArr[i];
            } else {
                console.log("no comic matched!");
            }
        }

        console.log("comic for edit is = " + comic);

        //re-render and pass result to comic_editpage.ejs
        //res.render("comic_editpage.ejs",{editComic: comic});

        if(req.session.user){
            res.render("comic_editpage", { info: "Chapter created succesfully!", editComic: comic , loggedInUser: (req.session.user["username"]) || "none" });
        }else{
            res.render("comic_editpage", { editComic: comic });
        }

    }).catch((error)=>{
        console.log(error);
    });

});

//To update a comic series
router.post("/:id", upload.single('comicImg'),(req, res) => {
    //   req.body.readyToEat = req.body.readyToEat === "on";
    //   user.findByIdAndUpdate(req.params.id, req.body, (err, updatedComic) => {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       res.redirect("/fruits");
    //     }
    //   });
        console.log("START OF POST EDIT COMIC REQUEST:");
        console.log("req.params.id is =" + req.params.id);
        console.log("user id is =" + req.session.user["_id"]);
        //console.log("req.body for put request is =" + req.body);
        console.log("req.body(stringified) for put request is =" + JSON.parse(JSON.stringify(req.body)));
        //console.log("req.body.title = " + req.body.title);
        //console.log("req.body[\"title\"] = " + req.body["title"]);
    
        //keep promise chain results referenced here
        //var results = {};
    
        user.findOneAndUpdate({ "_id": req.session.user["_id"], "comics._id": req.params.id },
        { 
            "$set": {
                "comics.$.title": req.body.title,
                "comics.$.synopsis": req.body.synopsis
                //"comics.$.mainImg": "/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename
            }
    
        }, {returnDocument: 'after'})
        
        .then((result) => {
    
            //results.result1 = result;
    
            //need to empty the folder first, and then move the file (delete previous image)
            fse.emptyDir("./public/uploads/comics/" + req.params.id.toString() + "/mainImg/", err => {
                if (err) return console.error(err)
                console.log('emptyDir success!')
            });
    
            //fs.emptyDir("./public/uploads/comics/" + req.params.id.toString() + "/mainImg/")
    
            }).then(() => {
    
            //move image file from temp to comic folder named after id
            const comicId = req.params.id;
            const currentPath = req.file.path;
            const destinationPath = "./public/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename;
            fse.mkdirsSync("./public/uploads/comics/" + comicId.toString() + "/mainImg");
    
            mv(currentPath, destinationPath, function(err) {
                if (err) {
                    throw err
                } else {
                    console.log("Successfully moved the file!");
                }
            });
    
            //probably should need another .then here (make the file relocation a promise)
    
            //need to use return to chain Mongoose/Mongo queries
            return user.findOneAndUpdate({ "_id": req.session.user["_id"], "comics._id": comicId },
            { 
                "$set": {
                    "comics.$.mainImg": "/uploads/comics/" + comicId.toString() + "/mainImg/" + req.file.filename
                }
    
            }, {returnDocument: 'after'})
            
            }).then((result)=>{
    
            
            //then we need another chained promise/mongoose query to update img address
    
            //update req.session.user
            //req.session.user = results.result1;
            req.session.user = result;
    
            //render comic_editpage.ejs and pass the comic object to it
            //grab only the spesific comic as an object from return result
            const comicsArr = req.session.user["comics"];
            //console.log("comicsArr : " + comicsArr);
            //console.log("comicsArr[4] : " + comicsArr[4]);
            //console.log("comicsArr[4][\"_id\"] : " + comicsArr[4]["_id"]);
            //console.log("req.params.id : " + req.params.id);
    
            //checking typing
            //comicsArr[4]["_id"] is an object which is why strict comparison doesnt work
            //console.log("comicsArr[4][\"_id\"] type is : " + typeof(comicsArr[4]["_id"]));
            //console.log("req.params.id type is : " + typeof(req.params.id));
    
            var comic;
    
            for (i=0;i<comicsArr.length;i++){
                if (comicsArr[i]["_id"] == req.params.id){
                    console.log("comic id matched!");
                    comic = comicsArr[i];
                } else {
                    console.log("no comic matched!");
                }
            }
    
            console.log("comic for edit is = " + comic);
    
            console.log("result of put request is :" + comic);
    
            if (req.session.user) {
                res.render("comic_editpage.ejs",{info : "Updated comic details succesfully!", loggedInUser: req.session.user["username"], editComic: comic});
            } else {
                res.render("comic_editpage.ejs",{info: "No user logged in"});
            }
            
    
    
        }).catch((error)=>{
            console.log(error);
        });
    
        
    });

//To delete comic details
// router.delete("/:id", (req, res) => {
//     // res.send("Deleting...");
//     fruit.findByIdAndDelete(req.params.id, (err, success) => {
//       if (err) {
//         console.log(err);
//       } else {
//         //Redirect back to index page
//         res.redirect("/userpage");
//       }
//     });
// });

router.get("/chapters/edit-chapters", (req,res) => {
    //pass a new object and refresh comic_editpage.ejs

});



router.delete("/:id", (req,res) => {
    
    //let deletePath = "../public/uploads/comics/" + req.params.id;
    
    // var comicsArr = req.session.user["comics"];
    // for (let i=0;i < comicsArr.length; i++) {
    //     if (comicsArr[i]._id === req.params.id){
    //         deletePath = comicsArr[i].mainImg;
    //         break;
    //     }
    // }

    //console.log("deletePath: " + deletePath);
    //TODO: use fs.unlink to delete path



    user.findByIdAndUpdate(req.session.user["_id"], {
        "$pull": {
          "comics": {
            
            "_id": req.params.id
            
          },
        }, 
    }, {returnDocument: 'after'}).then((result)=>{
        console.log("deleting a comic from user:" + req.session.user["username"]);
        console.log(result);
        console.log("current session's id: " + req.session.id);
        req.session.user = result;
        console.log("current session object: ")
        console.log(req.session.user);
        console.log("current session's id: " + req.session.id);

        //delete image in public folder here
        // fs.rmdirSync("./public/uploads/comics/"+req.params.id, {recursive:true}, (err) => {
        //     if (err) {
        //         console.log("failed to delete local image:"+err);
        //     } else {
        //         console.log('successfully deleted local image');                                
        //     }
        // });

        fs.rmSync("./public/uploads/comics/"+req.params.id, {recursive:true}) }).then((result)=>{
            res.render("user_editpage", {info: "Comic deleted succesfully!", loggedInUser: req.session.user["username"], userComics: req.session.user["comics"]})
        }).catch((error)=>{
            console.error('Error removing item:', error);
        });

});

//   const removeFavoriteItem = async (userId, itemId) => {
//     try {
//       await User.updateOne({ _id: userId }, {
//         $pull: { favorites: itemId }
//       });
//       console.log('Item removed successfully!');
//     } catch (error) {
//       console.error('Error removing item:', error);
//     }
//   };

module.exports = router;