const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const auth = require("./Routes/auth");
const user = require("./Routes/user");
const { mongoKey, devPort } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", auth);
app.use("/user", user);

app.use("/ping", (req, res) => {
  return res.send({ message: "Working!" });
});

const port = process.env.PORT || devPort;

// FOR RANDOM STRING: node -> require("crypto").randomBytes(64).toString('hex')

mongoose.connect(mongoKey).then((res) => {
  console.log("Connected!");
});

app.listen(port, () => {
  console.log(`Auth App listening at http://localhost:${port}`);
});
