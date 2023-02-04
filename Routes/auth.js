const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const User = require("../Models/User");
const { jwtRefresh } = require("../config");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/Helpers");

router.post(
  "/login",
  [check("email", "Invalid Email!").isEmail()],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!(email && password)) {
        return res.status(400).send({ message: "All inputs are required!" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const user = await User.findOne({ email });
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

router.post(
  "/sign-up",
  [
    check("email", "Please Provide A Valid Email!").isEmail(),
    check("password", "Please Provide A Valid Password!").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const { email, password, name, phone, role, identity } = req.body;
      if (!(email && password && name && phone && role && identity)) {
        return res.status(400).send("All inputs are required!");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(409).send({
          message: "Woops! This email already exists. Try out with a new one.",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedIdentity = await bcrypt.hash(identity, 5);

      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role,
        identity: hashedIdentity,
      });

      res.status(201).send({
        message: "You've successfully registered!",
      });
    } catch (error) {
      console.log("Error from sign-up api", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// verifies the refresh token, checks if email exists in db and generates an access token
router.post("/generate-access-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send({ message: "Token not found!" });

    jwt.verify(token.split(" ")[1], jwtRefresh, async (err, userDetails) => {
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

// todo: check the identifier flag when changing password
router.post("/reset-password", (req, res) => {
  res.send({ msg: "han bhae kia haal hain?" });
});

// todo: check the identifier flag
router.post(
  "/forgot-password",
  [check("email", "Invalid Email!").isEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).send("Email is required!");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).send({ message: "Woops! User Not found." });
      }
      // TODO: send an otp to user with a few minutes of validation
    } catch (e) {
      console.error("Error inside forgot password: ", e);
    }
  }
);

module.exports = router;
