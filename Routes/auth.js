const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const otpGenerator = require("otp-generator");

const User = require("../Models/User");
const { jwtRefresh } = require("../config");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/Helpers");
const middleware = require("../Utils/Middleware");

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
router.post(
  "/generate-access-token",
  middleware.authenticateRefreshToken,
  async (req, res) => {
    try {
      const { user } = req;

      const userData = await User.findOne({ email: user.email });
      if (!userData) {
        return res.status(404).send({ message: "Woops! User Not found." });
      }
      const accessToken = generateAccessToken(userData);
      return res.status(200).send({
        accessToken: `bearer ${accessToken}`,
      });
    } catch (e) {
      console.log("error from access token api", e);
      res.status(500).json({ message: "Something went wrong!" });
    }
  }
);

// todo: check the identifier flag when changing password
router.post(
  "/reset-password",
  [check("email", "Invalid Email!").isEmail()],
  middleware.authenticateRefreshToken,
  async (req, res) => {
    try {
      const { password, identity, email, updatedPassword } = req.body;

      if (!(password && identity && email && updatedPassword))
        return res.status(400).json({ message: "All fields are required!" });

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

      if (
        (await bcrypt.compare(password, user.password)) &&
        (await bcrypt.compare(identity, user.identity))
      ) {
        const hashedPassword = await bcrypt.hash(updatedPassword, 10);

        const filter = { email: user.email };
        const updatedDoc = {
          password: hashedPassword,
        };

        const result = await User.updateOne(filter, updatedDoc);

        if (result.modifiedCount) {
          return res.status(200).send({
            message: "Password Updated Successfully!",
          });
        }
      } else {
        return res.status(401).send({
          message:
            "Couldn't update password! Identity or Old Password does not matches.",
        });
      }
      return res.status(401).send({
        message: "Something went wrong. Couldn't update password!",
      });
    } catch (e) {
      console.log("Error from change password: ", e);
      res.status(500).send({
        message: "Something went wrong. Couldn't update the password",
      });
    }
  }
);

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

      const otp = await otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      // TODO: send an otp to user with a few minutes of validation
      // TODO: save otp in db with email, if same email otp is generated, delete prev one and save new one
    } catch (e) {
      console.error("Error inside forgot password: ", e);
    }
  }
);

module.exports = router;
