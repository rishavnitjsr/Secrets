const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const PORT = 3000;
const URI = "mongodb+srv://rbonweb:r%40b0n%5FWeb3@cluster0.bjvh0ix.mongodb.net/userDB";

app.use(session({
  secret: 'Our Little Secret',    //long string
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(URI, {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: "422065088889-iv2c43il1tjll1ic1knjgj0ro8jtqerm.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "https://secret-pro.onrender.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/auth/google",
    passport.authenticate("google",{scope:['profile']}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/secrets",(req,res)=>{
    User.find({"secret": {$ne :null}}).then((foundUsers)=>{
      if(foundUsers){
        res.render("secrets",{usersWithSecrets: foundUsers});
      }
    }).catch((err)=>{
      console.log(err);
    });
})

app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login")
    }
});

app.post("/submit",(req,res)=>{
  const submittedSecret = req.body.secret;
  console.log(req.user._id);
  User.findById(req.user._id).then((foundUser)=>{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save().then(()=>{
          res.redirect("/secrets");
        });
      }
  }).catch((err)=>{
    console.log(err);
  })
})

app.get("/logout",(req,res)=>{
    req.logout(()=>{
        res.redirect("/")
    });  
})

app.post("/register",(req,res)=>{
    User.register({username: req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            }) 
        }
    })
})

app.post("/login",(req,res)=>{
 const user = new User({
    email : req.body.username,
    password : req.body.password
 })

 req.login(user, (err)=>{
    if(err){
        console.log(err);
    }
    else{
        passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets")
        })
    }
 })
   
})

app.listen(PORT,()=>{
    console.log(`Server is working on http://localhost:${PORT}`)
});
