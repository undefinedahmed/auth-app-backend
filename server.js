const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const auth = require("./Routes/auth");
const fakeData = require("./Routes/fakeData");
const { mongoKey, devPort } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", auth);
app.use("/fake", fakeData);

const port = devPort;

// FOR RANDOM STRING: node -> require("crypto").randomBytes(64).toString('hex')

mongoose.connect(mongoKey).then((res) => {
  console.log("Connected!");
});

app.listen(port, () => {
  console.log(`Auth App listening at http://localhost:${port}`);
});
