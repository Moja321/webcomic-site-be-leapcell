const express = require("express");
const router = express.Router();
const user = require("../models/user_schema.js");
const fs = require('fs');
const fse = require('fs-extra');
const mv = require("mv");
//const mongoose = require("mongoose");

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

router.post("/:userid/:comicid/like",(req,res)=>{

    console.log("START OF /comics/:userid&:comicid/like ROUTE:");

    console.log("req.params.userid : "+ req.params.userid);
    console.log("req.params.comicid : "+ req.params.comicid);

    //return;

    //2 mongoDB queries:

    //first we increment comics likes key by 1
    user.findOneAndUpdate({"comics._id":req.params.comicid},
    {
        $inc : {
            "comics.$.likes" : 1
        }

    }, {returnDocument: 'after'}).then((result)=>{

        console.log(result);
        //return;

        return user.findByIdAndUpdate(req.params.userid,{
            $push : {
                "liked" : req.params.comicid
            }
        }, {returnDocument:'after'})
    }).then((result)=>{

        console.log("like route result : " + result);
        if(req.session.user){
            req.session.user = result;
        }
        res.redirect("/comics/" + req.params.comicid + "/comic");

        //return;

    }).catch((error)=>{

    });
        
    

    //then we update users liked arr by adding comics id to it


});

router.post("/:userid/:comicid/unlike",(req,res)=>{

    console.log("START OF /comics/:userid&:comicid/unlike ROUTE:");

    console.log("req.params.userid : "+ req.params.userid);
    console.log("req.params.comicid : "+ req.params.comicid);

    //return;

    //2 mongoDB queries:

    //first we increment comics likes key by 1
    user.findOneAndUpdate({"comics._id":req.params.comicid},
    {
        $inc : {
            "comics.$.likes" : -1
        }

    }, {returnDocument: 'after'}).then((result)=>{

        console.log(result);
        //return;

        return user.findByIdAndUpdate(req.params.userid,{
            $pull : {
                "liked" : req.params.comicid
            }
        }, {returnDocument:'after'})
    }).then((result)=>{

        console.log("unlike route result : " + result);
        //console.log(result);
        if(req.session.user){
            req.session.user = result;
        }
        res.redirect("/comics/" + req.params.comicid + "/comic");
        //return;

    }).catch((error)=>{

    });
        
    

    //then we update users liked arr by adding comics id to it


});

//get all users route ("/")
router.get("/",(req,res)=>{
    // res.send("User list");
    console.log("START OF: /comics");


    //TODO:
    //Get all users using mongoose query and save to a variable, and pass it to res.render
    user.find({},'comics')
    .then((result)=>{

        console.log(result);
        console.log(result[2]);
        // if (result.length !== 0) {
        //     for (i=0; i<result.length;i++){
        //         console.log(result[i]);
        //     }
        // }

        //res.render("all_comicspage", {text: "all users", users: result});
        if (req.session.user){
            res.render("all_comicspage", {text: "all comics", comicsarr: result, loggedInUser: (req.session.user["username"]) || "none" });
        } else {
            res.render("all_comicspage", {text: "all comics", comicsarr: result});
        }
        

    }).catch((error)=>{
        console.log(error);
    });

    //res.render("all_userspage", {text: "all users"});
})

router.get("/:comicid/chapter",(req,res)=>{

    console.log("START OF: /comics/:comicid/chapter");
    console.log("req.query.chapterid : " + req.query.chapterid);

    user.findOne({"comics.chapters._id": req.query.chapterid}
        
    ).then((result)=>{

        console.log(result);
        //console.log(result[2]);
        // if (result.length !== 0) {
        //     for (i=0; i<result.length;i++){
        //         console.log(result[i]);
        //     }
        // }

        //return;

        const comic = findComic(result.comics,req.params.comicid);
        console.log("comic : "+ comic);

        //const chapter = {};

        //res.render("all_comicspage", {text: "all users", users: result});

        if(req.session.user){
            res.render("comicpage", {chapterId: req.query.chapterid, text: "for an individual comic", comic: comic , chapterid : req.query.chapterid , loggedInUser: (req.session.user["username"]) || "none" , userLiked:(req.session.user["liked"]), userId : (req.session.user["_id"])});
        }else{
            res.render("comicpage", {chapterId: req.query.chapterid, text: "for an individual comic", comic: comic , chapterid : req.query.chapterid });
        }
        

    }).catch((error)=>{
        console.log(error);
    });


});

router.get("/:comicid/comic",(req,res)=>{
    // res.send("User list");
    console.log("START OF: /comics/:id/comic");


    //TODO:
    //Get all users using mongoose query and save to a variable, and pass it to res.render

    // user.aggregate([
    //     {
    //       "$match": {
    //         "_id": req.params.id,
    //         "comics._id": req.params.comicid
    //       }
    //     }
    //     {
    //       "$unwind": "$comics"
    //     },
    //     {
    //       "$match": {
    //         "comics._id": req.params.comicid
    //       }
    //     },
    //     {
    //       "$replaceRoot": {
    //         "newRoot": "$comics"
    //       }
    //     }
    //   ]

    user.findOne({"comics._id": req.params.comicid}
        
        // {"comics.$[i].someNestedArray.$[j].name":"1"},
        // {
        //     arrayFilters: [{
        //         "i._id": req.params.id
        //     }, {
        //         "j._id": req.body.chapters
        //     }]
        // },
    ).then((result)=>{

        console.log(result);
        //console.log(result[2]);
        // if (result.length !== 0) {
        //     for (i=0; i<result.length;i++){
        //         console.log(result[i]);
        //     }
        // }

        const comic = findComic(result.comics,req.params.comicid);
        console.log("comic : "+ comic);

        //res.render("all_comicspage", {text: "all users", users: result});
        //const userLikedArr = 
        if (req.session.user){
            console.log("userLiked : "+ req.session.user["liked"]);
            console.log(typeof(req.session.user["liked"]));
            console.log(typeof(req.session.user["liked"][0]));
            console.log(typeof(comic["_id"]));
        }
        

        if(req.session.user){
            res.render("comicpage", {text: "for an individual comic", comic: comic , loggedInUser: (req.session.user["username"]) || "none" , userLiked:(req.session.user["liked"]), userId : (req.session.user["_id"])});
        }else{
            res.render("comicpage", {text: "for an individual comic", comic: comic});
        }

    }).catch((error)=>{
        console.log(error);
    });


    //res.render("all_userspage", {text: "all users"});
})






module.exports = router;