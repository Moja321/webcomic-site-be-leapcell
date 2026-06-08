const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const user = require("../models/user_schema.js");

// router.get("/",(req,res)=>{
//     // res.send("User list");
//     res.render("index", {text: "signup"});
// })

// remember to use 'x-www-form-urlencoded' as request body type if using Postman to test this route (because we used express.urlencoded to read request body)
router.post("/", (req, res) => {

    console.log(req.body);
    console.log(req.body.password);
    //res.render("index",{createdUser:req.body.username});

    const randomSaltSync = Math.floor(Math.random() * 10) + 1;

    req.body.password = bcrypt.hashSync(
      req.body.password,
      bcrypt.genSaltSync(randomSaltSync)
    );

    //Below doesnt work anymore because MongoDB only accepts promises for Model.create() now:
    // signup.create(req.body, (err, createdUser) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log("Successfully created user: " + createdUser.username);
    //     //req.session.user = createdUser;
    //     res.send(createdUser);
    //     //res.redirect("/origami");
    //   }
    // });

    //We have to use promises instead:
    user.create(req.body).then((result)=>{
        console.log(result);
        res.render("index", {createdUser: result.username});
    }).catch((error)=>{
        console.log(error);
    });

//   M_User
//   .create(data)
//   .then(() => {
//       res.send({
//           kq: 1,
//           msg: 'Đã thêm thành công'
//       });
//   })
//   .catch((err) => {
//       res.send({
//           kq: 0,
//           msg: 'kết nối DB thất bại'
//       });
//       console.error(err);
//   });

});

module.exports = router;