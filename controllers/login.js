const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const login = require("../models/user_schema.js");

router.get("/",(req,res)=>{
    // res.send("User list");
    res.render("index", {text: "login"});
})

// router.post("/", (req, res) => {
//   login.findOne({ username: req.body.username }, (err, foundUser) => {
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUser) {
//         if (bcrypt.compareSync(req.body.password, foundUser.password)) {
//           req.session.user = foundUser;

//           console.log(foundUser);
//           //res.send(foundUser);

//           res.render("index", {loggedInUser: foundUser.username});
//           //res.redirect("/origami");
//         } else {
//           res.send(JSON.parse("Username or password is wrong")); //check status on react
//         }
//       }
//     }
//   });
// });

//TODO : redirect/refresh page and show "can not login" message in case of failure

//login.findOne implementation using promises (Model.findOne doesnt accept callbacks anymore)
router.post("/",(req,res)=>{

    login.findOne({username: req.body.username}).then((result)=>{

        if (result) {

            if (bcrypt.compareSync(req.body.password, result.password)) {
             
                req.session.regenerate(function (err) {
                    if (err) next (err);

                    //we are creating a "user" key inside the session object and storing the result. This key can be named anything.
                    req.session["user"] = result;
            
                    console.log(result);
                    //res.send(foundUser);
            
                    //res.render("index", {loggedInUser: result.username});

                    // save the session before redirection to ensure page
                    // load does not happen before session is saved
                    req.session.save(function (err) {
                        if (err) return next(err);
                        //For logins, its recommended that we redirect first to another url 
                        //which will request a GET method to render the page, see index.js
                        res.redirect("/");
                    })

                })
            
            } else {

            //res.send(JSON.parse("Username or password is wrong")); //check status on react

            res.render("index.ejs",{info: "User does not exist"});
            }
        } else if (!result) {
            //let loginMsg = "User does not exist";
            res.render("index.ejs",{info: "User doesn't exist"});//make sure to use <%- instead of <%= in index.ejs so that the symbols work (unescaped)
        }

    }).catch((error)=>{
        console.log(error);
    });

});

// user.create(req.body).then((result)=>{
//     console.log(result);
//     res.render("index", {createdUser: result.username});
// }).catch((error)=>{
//     console.log(error);
// });

router.get("/logout", (req, res) => {
    console.log("Logging out user :" + req.session.user["username"]);
    console.log(req.session.user);

    // if (Object.keys(req.session.user).length !== 0){ //check if req.session.user is not empty
    //     req.session.destroy(() => {
    //         res.redirect("/");
    //     });
    // }

    if (req.session.user){ //check if req.session.user exists
        req.session.destroy(() => {
            console.log(req.session); //this cant be accessed(returns undefined), but a new session object is recreated after the redirect

                res.redirect("/");

        });
    }    
});




module.exports = router;