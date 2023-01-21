const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");

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

app.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    if (await bcrypt.compare(req.body.password, "hashed password from DB")) {
      console.log("Matches");
      res.send("Login Successful");
    } else {
      res.send("Login Failed");
    }
    res.send(true);
  } catch (error) {
    console.log("Error from login api", error);
    res.status(500).send(false);
  }
});

app.post("/sign-up", async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!(email && password && name && phone && role)) {
      return res.status(400).send("All inputs are required!");
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

    // todo: generate two tokens, 1) access token 2) refresh token
    // todo: use generateAccessToken function here
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      jwtSecret,
      {
        expiresIn: "2h",
      }
    );

    res.status(201).send({ userData: user, token: `bearer ${token}` });
  } catch (error) {
    console.log("Error from sign-up api", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// todo: use generateAccessToken function here
app.post("/access-token", (req, res) => {});

// if user has a valid access token, then only show him the list of users
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

app.listen(port, () => {
  console.log(`Auth App listening at http://localhost:${port}`);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
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
