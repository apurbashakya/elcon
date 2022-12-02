//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/elconDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  electricityId: Number,
  name: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    res.render("home");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    var user = req.user;
    User.findOne({ username: user.username }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("dashboard", { User: foundUser });
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/register", (req, res) => {
  User.register(
    {
      username: req.body.username,
      name: req.body.name,
      electricityId: req.body.electricityId,
      active: false,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/dashboard");
        });
      }
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, () => console.log("Server is running"));
