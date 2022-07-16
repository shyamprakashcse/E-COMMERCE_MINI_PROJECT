//jshint esversion: 6
//initialization
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const multer = require('multer');
const path = require("path");
const saltRounds = 10;
const app = express();





// multer disk storage setup



var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/myupload")
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});
//static folder views templating engine setting

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));




//database connection setup 
const mongoose = require('mongoose');
const { access } = require('fs');
mongoose.connect("mongodb://localhost:27017/UserDB", { useUnifiedTopology: true, useNewUrlParse: true });
//schema production 
const userSchema = {

        name: String,
        password: String,
        email: String,
        cell: String,
        products: Array,
        label: Number
    }
    // product schema of constructor 
function ProductCard(email, ImagePath, Title, ProductName, Description, Address) {
    this.EMAIL = email;
    this.ImagePath = ImagePath;
    this.Title = Title;
    this.ProductName = ProductName;
    this.Description = Description;
    this.Address = Address;
}
// database model setup 
const User = new mongoose.model("User", userSchema);


// get routing 
app.get("/home", function(req, res) {
    res.sendFile(__dirname + "/CreateAccount.html");
});
app.get("/login", function(req, res) {
    res.sendFile(__dirname + "/mainLoginpage.html");
});
app.get("/ProfileLogin", function(req, res) {
    res.render("ProfileLogin");
});


// post routing 
app.post("/navlog", function(req, res) {
    res.redirect("/login");
});
app.post("/Newuser", function(req, res) {
    res.redirect("/home");
});
app.post("/error", function(req, res) {
    res.redirect("/login");
});
app.post("/ErrNewuser", function(req, res) {
    res.redirect("/home");
});
app.post("/addproducts", function(req, res) {
    res.render("AddProducts");
});


app.post("/login", function(req, res) {
    const EMAIl = req.body.email;
    const USERPASSWORD = req.body.pass;


    User.findOne({ email: EMAIl }, function(err, found) {
        if (err)
            res.render("LoginError");
        else {
            if (found) {
                const DBHASH = found.password;
                bcrypt.compare(USERPASSWORD, DBHASH, function(err, match) {
                    if (err)
                        res.render("LoginError", { TEXT: err });
                    else if (match) {
                        TotalUserProducts = [];
                        SeperateItems = [];
                        User.find({ label: 1 }, function(err, docs) {
                            if (err)
                                console.log(err);
                            else {

                                var i, j;
                                for (i = 0; i < docs.length; i++) {
                                    TotalUserProducts.push(docs[i].products);
                                }

                                for (i = 0; i < TotalUserProducts.length; i++) {
                                    var EachUserProductsList = TotalUserProducts[i];
                                    for (j = 0; j < EachUserProductsList.length; j++) {
                                        SeperateItems.push(EachUserProductsList[j]);
                                    }

                                }
                                res.render("home", { name: found.name, mail: found.email, ITEM: SeperateItems });


                            }
                        });


                    } else
                        res.render("LoginError", { TEXT: "PASSWORD MISMATCH. please use the registered password" });
                });
            } else {
                res.render("LoginError", { TEXT: "Invalid Email Id .Please use the Registered one" });
            }
        }

    });


});

app.post("/productsuploading", upload.single('prodimg'), (req, res, next) => {
    const poll = req.body.email;
    const USERPASSWORD = req.body.pass;
    const filed = req.file;
    const title = req.body.title;
    const productname = req.body.prodname;
    const describe = req.body.description;
    const address = req.body.contact;

    if (!filed) {
        console.log("error");
    } else {

        var h = "myupload/" + filed.filename;
        var NewItem = new ProductCard(poll, h, title, productname, describe, address);

        console.log(NewItem);
        User.findOne({ email: poll }, function(err, found) {
            if (err) {
                console.log("Invalid Email Id Please Use Registered One");
                console.log(err);
            } else {
                if (found) {
                    const DBHASH = found.password;
                    bcrypt.compare(USERPASSWORD, DBHASH, function(err, match) {
                        if (err)
                            res.render("LoginError");
                        else if (match) {
                            User.updateOne({ email: poll }, { $push: { products: [NewItem] } },
                                function(err, result) {
                                    if (err) {
                                        res.send(err);
                                    } else {
                                        console.log("Item added successfully");
                                    }
                                }
                            );

                        } else
                            res.render("LoginError", { TEXT: "Password Mismatch Please Use the Registered Password" });
                    });
                } else {
                    res.render("LoginError", { TEXT: "INVALID EMAIL.Please Use the registered Email" });
                }
            }
        })


        res.redirect("/login");


    }




});

app.post("/create", function(req, res) {
    var USERNAME = req.body.username;
    var poll = req.body.mail;
    var PASSWORD = req.body.passkey;
    var PHONE = req.body.mobileno;
    var LABEl = 1


    User.findOne({ email: poll }, function(err, found) {
        if (err)
            console.log(err);
        else if (found) {
            console.log("User is available");
            res.render("LoginError", { TEXT: "Oops! sorry Already USER exists with the same data.Use different mailid" });
        } else {
            console.log("hey New user welcome");



            bcrypt.hash(PASSWORD, saltRounds, function(err, hash) {


                const newUser = new User({
                    name: USERNAME,
                    password: hash,
                    email: poll,
                    cell: PHONE,
                    products: [],
                    label: 1
                });

                newUser.save(function(err) {
                    if (err)
                        console.log(err);
                    else {

                        TotalUserProducts = [];
                        SeperateItems = [];
                        User.find({ label: 1 }, function(err, docs) {
                            if (err)
                                console.log(err);
                            else {

                                var i, j;
                                for (i = 0; i < docs.length; i++) {
                                    TotalUserProducts.push(docs[i].products);
                                }

                                for (i = 0; i < TotalUserProducts.length; i++) {
                                    var EachUserProductsList = TotalUserProducts[i];
                                    for (j = 0; j < EachUserProductsList.length; j++) {
                                        SeperateItems.push(EachUserProductsList[j]);
                                    }

                                }
                                res.render("home", { name: USERNAME, mail: poll, ITEM: SeperateItems });

                            }
                        });


                    }

                });
            });



            //data base logic with authentication verification is requires  



        }

    });

});
app.post("/NewUser", function(req, res) {
    res.redirect("/home");
});

app.post("/logout", function(req, res) {
    res.redirect("/login");
});


app.post("/ProfileLoginVerify", function(req, res) {
    const user = req.body.EMAIL;
    const pass = req.body.PASS;
    User.findOne({ email: user }, function(err, found) {
        if (err)
            console.log(err);
        else {
            if (found) {
                bcrypt.compare(pass, found.password, function(err, match) {
                    if (err)
                        console.log(err);
                    else if (match) {

                        res.render("Profile", { PROFILENAME: found.name, PROFILEMOBILE: found.cell, PROFILEEMAIL: found.email, PROFILEPRODUCTS: found.products });
                    } else
                        res.render("profileLoginerr", { TEXT: "PASSWORD INCORRECT. Use the correct password which you have used to create the account" });
                })
            } else
                res.render("profileLoginerr", { TEXT: "EMAIL-ID INVALID.Please use the registered email" });
        }
    });

});
app.post("/profilelogerr", function(req, res) {
    res.render("profileLogin");
});

app.post("/Updateprofile", function(req, res) {
    res.render("UpdateProfile");
});

app.post("/UpdateName", function(req, res) {
    res.render("NameModify");
});

app.post("/UpdateEmail", function(req, res) {
    res.render("EmailModify");
});

app.post("/UpdatePassword", function(req, res) {
    res.render("PassWordModify");
});

app.post("/UpdateMobile", function(req, res) {
    res.render("MobileModify");
});

app.post("/NameUpdateInput", function(req, res) {
    const RegMail = req.body.EMAIL;
    const RegPass = req.body.PASS;
    const NewName = req.body.MODIFIED;
    console.log(RegMail, RegPass, NewName);

    User.findOne({ email: RegMail }, function(err, found) {
        if (err)
            res.render("LoginError", { TEXT: "INTERNAL ERROR! Sorry for the inconvinent we will update soon" });
        else {
            if (found) {
                bcrypt.compare(RegPass, found.password, function(err, match) {
                    if (err)
                        res.render("LoginError", { TEXT: "INTERNAL ERROR!. Sorry for the inconvinent Experience ,work is under construction" });
                    else if (match) {

                        User.findOneAndUpdate({ email: RegMail }, { name: NewName }, { new: true }, (err, data) => {
                            if (err)
                                res.render("LoginError", { TEXT: "INTERNAL ERROR! We will correct soon" });
                            else {
                                console.log(data);
                                console.log("Succesfully name changed");
                            }

                        });


                        res.render("sample", { TEXT: "SUCCESSFULLY YOUR NAME IS CHANGED AND UPDATED" });
                    } else {
                        res.render("LoginError", { TEXT: "PASSWORD MISMATCH" });
                    }
                })
            } else
                res.render("LoginError", { TEXT: "INVALID EMAIl-ID.Data match not found" });
        }
    })
});


app.post("/MobileUpdateInput", function(req, res) {
    const RegMail = req.body.EMAIL;
    const RegPass = req.body.PASS;
    const NewName = req.body.MODIFIED;
    console.log(RegMail, RegPass, NewName);

    User.findOne({ email: RegMail }, function(err, found) {
        if (err)
            res.render("LoginError", { TEXT: "INTERNAL ERROR!. Sorry for the inconvinent Experience ,work is under construction" });
        else {
            if (found) {
                bcrypt.compare(RegPass, found.password, function(err, match) {
                    if (err)
                        res.render("LoginError", { TEXT: "INTERNAL ERROR!. Sorry for the inconvinent Experience ,work is under construction" });
                    else if (match) {

                        User.findOneAndUpdate({ email: RegMail }, { cell: NewName }, { new: true }, (err, data) => {
                            if (err)
                                res.render("LoginError", { TEXT: "INTERNAL ERROR!. Sorry for the inconvinent Experience ,work is under construction" });
                            else {
                                console.log(data);
                                console.log("Succesfully Mobile no is  changed");
                            }

                        });


                        res.render("sample", { TEXT: "SUCCESSFULLY YOUR MOBILE NO IS CHANGED AND UPDATED" });
                    } else {
                        res.render("LoginError", { TEXT: "INVALID PASSWORD" });
                    }
                })
            } else
                res.render("LoginError", { TEXT: "MATCH NOT FOUND Please enter valid Email-Id! " });
        }
    })
});

app.post("/EMAILUpdateInput", function(req, res) {
    const RegMail = req.body.EMAIL;
    const RegPass = req.body.PASS;
    const NewName = req.body.MODIFIED;
    console.log(RegMail, RegPass, NewName);

    User.findOne({ email: RegMail }, function(err, found) {
        if (err)
            res.render("LoginError");
        else {
            if (found) {
                bcrypt.compare(RegPass, found.password, function(err, match) {
                    if (err)
                        res.render("LoginError");
                    else if (match) {

                        User.findOneAndUpdate({ email: RegMail }, { email: NewName }, { new: true }, (err, data) => {
                            if (err)
                                res.render("LoginError");
                            else {
                                console.log(data);
                                console.log("Succesfully EMAIL is  changed");
                            }

                        });


                        res.render("sample", { TEXT: "SUCCESSFULLY YOUR EMAIL IS CHANGED AND UPDATED" });
                    } else {
                        res.render("LoginError", { TEXT: "PASSWORD MISMATCH!" });
                    }

                })
            } else
                res.render("LoginError", { TEXT: "ENTER REGISTERED EMAIL-ID! DATA MISMATCH" });
        }
    });
});

app.post("/PassWordUpdateInput", function(req, res) {
    const RegMail = req.body.EMAIL;
    const RegPass = req.body.PASS;
    const NewName = req.body.MODIFIED;
    var p = "1";

    console.log(RegMail, RegPass, NewName);

    User.findOne({ email: RegMail }, function(err, found) {
        if (err)
            res.render("LoginError", { TEXT: "INTERNALERROR" });
        else {
            if (found) {

                bcrypt.hash(NewName, saltRounds, function(err, hash) {
                    if (err)
                        res.render("LoginError", { TEXT: "hash conversion error" });
                    else {
                        User.findOneAndUpdate({ email: RegMail }, { password: hash }, { new: true }, (err, data) => {
                            if (err)
                                console.log(err);
                            else {
                                console.log(data);
                                console.log("Successfully password changed");
                                res.render("sample", { TEXT: "Your Password is changed Successfully" });
                            }

                        });

                    }



                });


            } else
                res.render("LoginError", { TEXT: "Email-Id mismatch" });
        }
    });









});



app.post("/profiletohome", function(req, res) {
    res.redirect("/login");
});

app.listen(3000, function(req, res) {
    console.log("Server is started and listening at port 3000");


});