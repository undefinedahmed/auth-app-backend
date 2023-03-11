const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const otpGenerator = require("otp-generator");

const User = require("../Models/User");
const OTP = require("../Models/OTP");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/Helpers");
const middleware = require("../Utils/Middleware");
const sendMail = require("../Utils/Email");

router.post(
  "/login",
  [check("email", "Invalid Email!").isEmail()],
  async (req, res) => {
    try {
      const { email, password, identifier } = req.body;
      if (!(email && password && identifier)) {
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
      if (
        (await bcrypt.compare(req.body.password, user.password)) &&
        (await bcrypt.compare(req.body.identifier, user.identifier))
      ) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return res.status(200).send({
          message: "Login Successful",
          accessToken: `bearer ${accessToken}`,
          refreshToken: `bearer ${refreshToken}`,
        });
      }
      return res.status(401).send({ message: "Woops! Wrong Credentials" });
    } catch (error) {
      console.log("Error from login api", error);
      return res.status(500).send(false);
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
      const { email, password, name, phone, role, identifier } = req.body;
      if (!(email && password && name && phone && role && identifier)) {
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
      const hashedIdentifier = await bcrypt.hash(identifier, 5);

      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role,
        identifier: hashedIdentifier,
      });

      return res.status(201).send({
        message: "You've successfully registered!",
      });
    } catch (error) {
      console.log("Error from sign-up api", error);
      return res.status(500).json({ message: "Something went wrong" });
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
      return res.status(500).json({ message: "Something went wrong!" });
    }
  }
);

router.post(
  "/reset-password",
  [check("email", "Invalid Email!").isEmail()],
  middleware.authenticateRefreshToken,
  async (req, res) => {
    try {
      const { usingOtp, email, updatedPassword } = req.body;

      // todo: update password in case of otp
      // there will be no prev pass and identifier in case of using otp
      if (usingOtp) {
        return res.status(200).json({ message: "Some msg!" });
      }
      // ! end

      const { password, identifier } = req.body;

      if (!(password && identifier && email && updatedPassword))
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
        (await bcrypt.compare(identifier, user.identifier))
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
            "Couldn't update password! Identifier or Old Password does not matches.",
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

      const isOtpExists = await OTP.findOne({ email });
      if (isOtpExists) {
        const timeNow = new Date().getTime();
        if (isOtpExists.expiresAt > timeNow) {
          return res.status(400).send({
            message:
              "OTP already sent to your email. Please check your inbox or spam folder.",
          });
        }
        await OTP.deleteOne({ email })
          .then(() => console.log("Deleted otp"))
          .catch((e) => console.log(e));
      }

      const otp = await otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      const expires = new Date().getTime() + 30 * 60000;
      await OTP.create({
        email,
        code: otp,
        expiresAt: expires,
      })
        .then(async () => {
          await sendMail(
            user.name,
            email,
            `Your OTP six digit is ${otp}. Please paste it within 30 minutes from now.`,
            "OTP Verification"
          );
          return res.status(200).send({
            message: `OTP sent to your email: ${email}. Check your Inbox or Spam folder`,
          });
        })
        .catch((e) => {
          console.error("Error while saving OTP", e);
          return res
            .status(500)
            .send({ message: "Something went wrong. Couldn't generate OTP" });
        });
    } catch (e) {
      console.error("Error inside forgot password: ", e);
      return res
        .status(500)
        .send({ message: "Something went wrong. Couldn't generate OTP!" });
    }
  }
);

router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).send({ message: "OTP is required" });
  }

  const otpData = await OTP.findOne({ code: otp });
  if (!otpData) {
    return res.status(404).send({ message: "OTP Not found." });
  }
  const timeNow = new Date().getTime();
  if (otpData.expiresAt < timeNow) {
    return res.status(401).send({ message: "OTP Expired!" });
  }
  await OTP.deleteOne({ code: otp });
  return res.status(200).send({ message: "OTP Verified!" });
});

module.exports = router;
