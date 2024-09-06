// Filename - App.js

const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = 
        require("passport-local-mongoose"),
    methodOverride = require('method-override'),
    menuRoutes = require('./routes/menu'),
    cartRoutes = require('./routes/cart'),
    orderRoutes = require('./routes/order')
const User = require("./model/Users");
let app = express();

mongoose.connect("mongodb+srv://admin:admin@cluster0.jtfgm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: "123456",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000}
}));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.static('./assets'));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
    res.render("Login/home");
});

app.get("/home", function (req, res) {
  res.redirect('/');
})

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
    res.render("Login/secret");
});

// Showing register form
app.get("/register", function (req, res) {
    res.render("Login/register");
});

app.get("/profile", function (req, res) {
  res.render("Login/profile");
});

// Handling user signup
app.post("/register", function(req, res) {
  const newUser = new User({username: req.body.username, firstName: req.body.firstName, lastName: req.body.lastName,balance: 0, type: "Customer", dob: new Date(req.body.dob), prefFuel: req.body.prefFuel});
  User.register(newUser, req.body.password, function(err, user) {
      if (err) {
          console.log(err);
          return res.render("Login/register");
      }
      passport.authenticate("local")(req, res, function() {
          res.redirect("/secret");
      });
  });
});

//Showing login form
app.get("/login", function (req, res) {
    res.render("Login/login");
});

//Handling user login
app.post("/login", function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); // Handle error
    }
    if (!user) {
      // User not found or password mismatch
      return res.status(400).json({ error: "Invalid username or password" });
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); // Handle error during login
      }
      // Successfully logged in, redirect to home or secret page
      return res.redirect("/");
    });
  })(req, res, next);
});

//Handling user logout 
app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});



function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("Login/login");
}

let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});

app.use('/menu', menuRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);