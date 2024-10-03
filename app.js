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
  cartRoutes = require('./routes/cart')
  //orderRoutes = require('./routes/order')
const User = require("./model/Users");
const Station = require("./model/Stations");
const flash = require('connect-flash');
const http = require('http');
const socketIo = require('socket.io');
const Order = require('./model/Order');
const { format } = require('date-fns');

const crypto = require('crypto');
let app = express();

mongoose.connect("mongodb+srv://admin:admin@cluster0.jtfgm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
  secret: "123456",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 40000000 }
}));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.static('./assets'));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
const server = http.createServer(app);
const io = socketIo(server);

let userSockets = {};

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  req.io = io;
  next();
});
app.use(express.static('access'));
app.use(express.urlencoded({ extended: true }));


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

app.get("/profile", isLoggedIn, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).populate('items.item');
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      orderedAt: format(order.orderedAt, 'yyyy-MM-dd HH:mm')
  }));
    res.render("Login/profile", { currentUser: req.user, orders: formattedOrders });
});

// Handling user signup
app.post("/register", function (req, res) {
  let hashedCVV = 0;
  if (req.body.paymentMethod === 'card') {
    hashedCVV = hashCVV(req.body.CVV);
  }
  const newUser = new User({ 
    username: req.body.username, 
    firstName: req.body.firstName, 
    lastName: req.body.lastName, 
    balance: 0, 
    type: "Customer", 
    dob: new Date(req.body.dob), 
    prefFuel: req.body.prefFuel,
    point: 0,
    grade: "New Customer",
    paymentMethod: req.body.paymentMethod,
    cardNumber: req.body.paymentMethod === 'card' ? req.body.cardNumber : 0,
    expirationMonth: req.body.paymentMethod === 'card' ? req.body.expirationMonth : 0,
    expirationYear: req.body.paymentMethod === 'card' ? req.body.expirationYear : 0,
    securityQuestion: req.body.securityQuestion,
    CVV: hashedCVV,
  });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render("Login/register");
    }
    passport.authenticate("local")(req, res, function () {
      res.redirect("/");
    });
  });
});

//Showing login form
app.get('/login', (req, res) => {
  res.render('Login/login', {
    messages: {
      error: req.flash('error'),
      success: req.flash('success'),
    }
  });
});

//Handling user login
app.post("/login", function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      req.flash('success', 'Login successful!');
      return res.redirect("/");
    });
  })(req, res, next);
});

//Handling user logout 
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post('/fuel/pay', async (req, res) => {
  const { fuelType, amount } = req.body;
  // Logic to process payment and reserve a pump
  const availablePump = await getAvailablePump(); // Implement this function to get an available pump
  if (availablePump) {
      // Add fuel details to the cart
      req.session.cart = req.session.cart || [];
      req.session.cart.push({
          item: 'Fuel',
          name: `${amount} Liters of ${fuelType}`,
          price: calculateFuelPrice(fuelType, amount), // Implement this function to calculate the price
          quantity: 1,
          promo_percentage: 0
      });
      res.json({ pump: availablePump });
  } else {
      res.status(500).json({ error: 'No pumps available' });
  }
});

const getAvailablePump = async () => {
  // Mock implementation to get an available pump
  const pumps = ['Pump 1', 'Pump 2', 'Pump 3', 'Pump 4'];
  const reservedPumps = []; // Fetch reserved pumps from your database or session
  const availablePump = pumps.find(pump => !reservedPumps.includes(pump));
  return availablePump;
};

const calculateFuelPrice = (fuelType, amount) => {
  const fuelPrices = {
      'Ethanol 85': 1.50,
      'Diesel': 1.20,
      'Premium 95': 1.80,
      'Unleaded 91': 1.40
  };
  return fuelPrices[fuelType] * amount;
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("Login/login");
}

app.get('/profile/edit', (req, res) => {
  res.render('Login/edit', { user: req.user });
});

app.post('/profile/edit', async (req, res) => {
  try {
      const user = await User.findById(req.user._id);

      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.dob = new Date(req.body.dob);
      user.prefFuel = req.body.prefFuel;
      user.paymentMethod = req.body.paymentMethod;
      if (user.paymentMethod === 'card') {
          user.cardNumber = req.body.cardNumber;
          user.CVV = hashCVV(req.body.CVV)
          user.expirationMonth = req.body.expirationMonth;
          user.expirationYear = req.body.expirationYear;
      } else {
          user.cardNumber = null;
          user.CVV = null;
          user.expirationMonth = null;
          user.expirationYear = null;
      }

      await user.save();
      res.redirect('/profile');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

function hashCVV(cvv) {
  const hash = crypto.createHash('sha256');
  hash.update(cvv);
  return hash.digest('hex');
}

app.get('/forgot', (req,res) => {
  res.render('Login/forgot', {error: ""});
})

app.post('/forgot-password', async (req, res) => {
  const { username, securityAnswer } = req.body;

  try {
      const user = await User.findOne({ username: username });
      if (user && user.securityQuestion === securityAnswer) {
          res.render(`Login/reset`, {userId: user._id});
      } else {
          res.render('Login/forgot', { error: 'Invalid username or security answer.' });
      }
  } catch (err) {
      res.status(500).json({ message: 'An error occurred.' });
  }
});

app.get('/reset-password', (req,res) => {
  res.render('Login/reset', req.userId)
});

app.post('/reset-password/:userId', async (req, res) => {
  const userId = req.params.userId;
  const password = req.body.password;
  const user = await User.findById(userId);
  await user.setPassword(password);
  await user.save();
  req.flash('Success', 'You have successfully changed your password');
  return res.redirect('/login');
});

app.get('/GPS', async (req, res) => {
  const stations = await Station.find();
  res.render('Login/GPS', { stations });
  });

app.use('/menu', menuRoutes);
app.use('/cart', cartRoutes);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('registerUser', (userId) => {
      if (!userSockets[userId]) {
          userSockets[userId] = [];
      }
      userSockets[userId].push(socket.id);
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      for (const userId in userSockets) {
          userSockets[userId] = userSockets[userId].filter(id => id !== socket.id);
          if (userSockets[userId].length === 0) {
              delete userSockets[userId];
          }
      }
  });
});

const orderRoutes = require('./routes/order');

app.use('/order', orderRoutes(userSockets));

let port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log("Server Has Started!");
});

