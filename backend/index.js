const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./user.js");
const cors = require("cors");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = process.env.PORT || 8001;
const MONGOOSE_URL = process.env.MONGOOSE_URL;
const recapchaSecretKey = process.env.SECRET_KEY;
const USERNAME = process.env.EMAIL_USERNAME;
const PASSWORD = process.env.EMAIL_PASSWORD;
const origin = process.env.ORIGIN || "http://localhost:81";
const nodemailer = require('nodemailer')

app.use(express.json());
const corsOptions = {
  origin: origin,
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
mongoose
  .connect(MONGOOSE_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

app.post("/hourofcode/register", async (req, res) => {
  async function sendEmailNodemailer(toMail, name, roll) {
    try {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: USERNAME,
          pass: PASSWORD, //always use app password
        },
      });
      await transporter.sendMail({
        from: USERNAME,
        to: toMail,
        subject: "Registration for recruitment",
        headers: {
          "X-My-Header":
            "https://scontent-del2-1.xx.fbcdn.net/v/t39.30808-6/305819699_484347750365637_2455990691136540320_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=5f2048&_nc_ohc=pVAwo9W79ggAb7h7gEZ&_nc_ht=scontent-del2-1.xx&oh=00_AfAQUvBjQM7RfEC_mbDnIng-l3MYBPUO9l3MtU2S02IBPw&oe=6625C5B2",
        },
        html: `
            <font face="Google Sans" color="#444444" >
                <div style="font-size:110%">
                    <p>Hi ${name}</p>
                    <p>Online registration for Hour of code 3.0 has been completed</p>
                    <br />
                    <h1>${roll}</h1>
                    <p>If you have any comments or questions dont hesitate to reach us at our help desk or through our ig <a href="www.instagram.com/acm_akgec"> acm_akgec </a></p>
          
                    <p style="margin:0">Regards,</p>
                    <p style="margin:0">ACM AKGEC Student Chapter</p>
                </div>
            </font>
            `,
      });
    } catch (err) {
      console.log({ message: "error in sending email", error: err.message });
    }
  }
  try {
    // console.log(req.body);
    const encryptedData = req.body.encryptedData;
    console.log(encryptedData)
    const decryptedData = CryptoJS.AES.decrypt(
      encryptedData,
      recapchaSecretKey
    ).toString(CryptoJS.enc.Utf8);
    const decryptedDataJSON = JSON.parse(decryptedData);
    // console.log(decryptedDataJSON);
    const {
      fullName,
      rollNo,
      studentNo,
      email,
      gender,
      branch,
      year,
      hackerRankId,
    } = decryptedDataJSON;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${recapchaSecretKey}&response=${req.body.Token}`;
    const response = await fetch(url, {
      method: "POST",
    });
    const data = await response.json();
    console.log(data)
    if (data.success) {
      const oldUser = await User.findOne({
        $or: [{ studentNo }, { rollNo }],
      });
      // console.log(oldUser)
      if (oldUser) {
        return res.status(409).json({ message: "User already exists" });
      } else {
        const user = new User({
          fullName,
          rollNo,
          studentNo,
          email,
          branch,
          year,
          hackerRankId,
          gender,
        });
        await user.save();
        console.log(user)
        sendEmailNodemailer(email, fullName, rollNo);
        res.status(201).json({status: "success", message: "You have been registered successfully"});
      }
    } else {
      res
        .status(421)
        .json({ message: "Please verify that you are not a robot" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
