const express = require("express");
const router = express.Router();
const user = require("../models/user_schema.js");
let fs = require('fs');
let fse = require('fs-extra');
let mv = require("mv");

//get all users route ("/")
router.get("/",(req,res)=>{
    // res.send("User list");
    console.log("START OF: /users");


    //TODO:
    //Get all users using mongoose query and save to a variable, and pass it to res.render
    user.find({},'_id username')
    .then((result)=>{

        //console.log(result);
        if (result.length !== 0) {
            for (i=0; i<result.length;i++){
                console.log(result[i]);
            }
        }

        if(req.session.user){
            res.render("all_userspage", {text: "all users", users: result, loggedInUser:req.session.user["username"] || "none"});
        }else{
            res.render("all_userspage", {text: "all users", users: result});
        }
        

    }).catch((error)=>{
        console.log(error);
    });

    //res.render("all_userspage", {text: "all users"});
})

//get all comics from user route ("/usercomics")
router.get("/:id/usercomics",(req,res)=>{

    console.log("START OF: /users/:id/usercomics");

    user.findOne({'_id' : req.params.id},'username comics')
    .then((result)=>{

        console.log(result);
        console.log(result['_id']);

        if (result['comics'].length !== 0) {
            for (i=0; i<result['comics'].length;i++){
                console.log(result['comics'][i].title);
            }
        }

        //console.log(result);
        // if (result[0].length !== 0) {
        //     for (i=0; i<result[0].length;i++){
        //         console.log(result[0][i]);
        //     }
        // }

        if(req.session.user){
            res.render("user_comicspage", {text: "all comics of user", username: result['username'], comics: result['comics'],  loggedInUser:req.session.user["username"] || "none"});
        }else{
            res.render("user_comicspage", {text: "all comics of user", username: result['username'], comics: result['comics']});
        }

    }).catch((error)=>{
        console.log(error);
    });

})


module.exports = router;