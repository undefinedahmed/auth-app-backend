const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { check, validationResult } = require("express-validator");

const User = require("./Models/User");
const { mongoKey, devPort, jwtSecret, jwtRefresh } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

const port = devPort;

// FOR RANDOM STRING: node -> require("crypto").randomBytes(64).toString('hex')

mongoose.connect(mongoKey).then((res) => {
  console.log("Connected!");
});

app.post(
  "/login",
  [check("email", "Invalid Email!").isEmail()],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!(email && password)) {
        return res.status(400).send("All inputs are required!");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).send({ message: "Woops! User Not found." });
      }
      if (await bcrypt.compare(req.body.password, user.password)) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return res.status(200).send({
          message: "Login Successful",
          userData: user,
          accessToken: `bearer ${accessToken}`,
          refreshToken: `bearer ${refreshToken}`,
        });
      }
      res.status(401).send({ message: "Woops! Wrong Email Or Password!" });
    } catch (error) {
      console.log("Error from login api", error);
      res.status(500).send(false);
    }
  }
);

app.post(
  "/sign-up",
  [
    check("email", "Please Provide A Valid Email!").isEmail(),
    check("password", "Please Provide A Valid Password!").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const { email, password, name, phone, role } = req.body;
      if (!(email && password && name && phone && role)) {
        return res.status(400).send("All inputs are required!");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const userExists = await User.findOne({ email: email });
      if (userExists) {
        return res.status(409).send({
          message: "Woops! This email already exists. Try out with a new one.",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).send({
        userData: user,
        accessToken: `bearer ${accessToken}`,
        refreshToken: `bearer ${refreshToken}`,
      });
    } catch (error) {
      console.log("Error from sign-up api", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

app.post("/access-token", async (req, res) => {
  try {
    const { token } = req.body;
    jwt.verify(token.split(" ")[1], jwtSecret, async (err, userDetails) => {
      if (err) {
        return res.status(403).json({ message: "Access Denied!", err });
      }
      const user = await User.findOne({ email: userDetails.email });
      if (!user) {
        return res.status(404).send({ message: "Woops! User Not found." });
      }
      const accessToken = generateAccessToken(user);
      return res.status(200).send({
        accessToken: `bearer ${accessToken}`,
      });
    });
  } catch (e) {
    console.log("error from access token api", e);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

// if user has a valid access token, then only show him the list of users
// TODO: check if user is admin then send users else send todos
app.get("/get-fake-users", authenticateToken, async (req, res) => {
  try {
    await axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((resp) => res.status(200).send(resp.data))
      .catch((error) =>
        res.status(500).json({ message: "OOPS! Error in req", error })
      );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

// todo: use promise to get selected users from array
// select authors from frontend and get books in a single call using promise

app.listen(port, () => {
  console.log(`Auth App listening at http://localhost:${port}`);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // splitting the header because of bearer keyword
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "header not found" });

  jwt.verify(token, jwtSecret, (error, user) => {
    if (error)
      return res.status(403).json({ message: "Access Denied!", error });
    next();
  });
}

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtSecret,
    {
      expiresIn: "1h",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtSecret
  );
}
