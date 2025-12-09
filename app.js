// app.js (fixed)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
  console.error("FATAL: ATLASDB_URL is not set. Please add it to your .env or environment.");
  process.exit(1);
}

// connect to MongoDB first
async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("MongoDB connection error:", e);
    process.exit(1);
  }
}
main();

// Express + view config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Create Mongo session store AFTER dbUrl is confirmed
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET || "fallbacksecret",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.error("ERROR IN MONGO SESSION STORE:", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "fallbacksecret",
  resave: false,
  saveUninitialized: false, // better security: only save sessions if something set
  cookie: {
    // expires must be a Date object
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// session, flash, passport (order is important)
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// res.locals middleware (must be AFTER passport.session())
app.use((req, res, next) => {
  // temporary debug log — remove after confirming everything works
//   console.log("res.locals middleware; url:", req.originalUrl, " req.user:", req.user ? (req.user.username || req.user) : null);

  // set flashes and currUser for all templates
  res.locals.success = req.flash ? req.flash("success") : [];
  res.locals.error = req.flash ? req.flash("error") : [];
  res.locals.currUser = req.user || null;
  next();
});

// Debug route to inspect locals (remove when done)
app.get("/__debug_locals", (req, res) => {
  res.json({
    reqUser: req.user || null,
    localsUser: res.locals.currUser || null,
    localsSuccess: res.locals.success,
    localsError: res.locals.error,
    cookies: req.headers.cookie || null,
  });
});

// root redirect moved AFTER middleware to ensure sessions/locals set
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// register routers (after sessions & locals setup)
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// catch-all 404
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).render("error.ejs", { err });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
