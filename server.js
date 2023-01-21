const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./Models/User");
const { mongoKey, devPort, jwtSecret } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || devPort;

// auth-app-demha
// bbtUuPweMUnY6HmU

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

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      jwtSecret,
      {
        expiresIn: "2h",
      }
    );

    res.status(201).send({ userData: user, token });
  } catch (error) {
    console.log("Error from sign-up api", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Auth App listening at http://localhost:${port}`);
});
