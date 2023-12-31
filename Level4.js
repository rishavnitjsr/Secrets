require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
//const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const PORT = 3000;
const URI = "mongodb://localhost:27017/userDB";

mongoose.connect(URI, {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/",(req,res)=>{
    res.render("home");
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
})

app.post("/register",(req,res)=>{

    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
         const newUser = new User({
        email :req.body.username,
        password : hash
    });
    newUser.save().then(()=>{
        console.log("User Added Successfully.")
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    });
    });

})

app.post("/login",(req,res)=>{

    const username = req.body.username;
    const password = req.body.password;



    User.findOne({email: username}).then((foundUser)=>{
     if(foundUser){
         bcrypt.compare(password,foundUser.password,(err,result)=>{
             if(result){
                 res.render("secrets");
             }
             else{
                 res.redirect("/login");
             }
             }) 
         }
     }).catch((err)=>{
     console.log(err)
    })
});

app.listen(PORT,()=>{
    console.log(`Server is working on http://localhost:${PORT}`)
});
