const express = require("express");
const app = express();
const userModel = require("./models/user");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Register
app.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;

  let user = await userModel.findOne({ email });

  if (user) {
    return res.status(500).send("User already registered");
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        age,
        name,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");

      res.cookie("token", token);
      res.send("registered");
    });
  });
});

// Login
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });

  if (!user) {
    return res.status(500).send("Something went wrong");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");

      res.cookie("token", token);
      return res.status(200).send("You can login");
    } else {
      return res.redirect("/login");
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  res.cookie("token", "");

  res.redirect("/login");
});

// Check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    return res.send("You must be logged in");
  }

  try {
    let data = jwt.verify(req.cookies.token, "shhhh");

    req.user = data;

    next();
  } catch (err) {
    return res.send("You must be logged in");
  }
}

app.listen(3000);
