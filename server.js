const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const path = require("path");
const { error } = require("console");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");

const app = express();

app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "contact.db");

let db = null;

const initializeDataBse = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.run(
      `CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,        
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL ,
        isVerified BOOLEAN NOT NULL DEFAULT 0,
        verificationCode TEXT
        )`
    );

    app.listen(5000, () => {
      console.log("server running on localhost:5000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDataBse();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_email_password",
  },
});

app.post("/register", async (req, res) => {
  const { email, password } = req;
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationCode = Math.random().toString(36).substring(2, 15);

  if (name === "" || email === "" || phone === "") {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const query = `
    INSERT INTO user(email ,password,verificationCode) 
    VALUES (?,?,?);
    `;
    const result = db.run(query, [email, hashedPassword, verificationCode]);
    const payload = {
      id: result.lastID,
      name,
      email,
      phoneNumber,
    };

    const verificationLink = `http://localhost:5000/verify/${verificationCode}`;

    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: email,
      subject: "Email Verification",
      text: `Please verify your contact by clicking the following link: ${verificationLink}`,
    });

    const jwtToken = jwt.sign(payload, "SECRET_KEY", { expiresIn: "30d" });

    res.status(200).json({
      message: "contact Registration Success",
      jwt_token: jwtToken,
      contact: payload,
    });
  } catch (e) {
    if (e.message.includes("UNIQUE constraints failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.log(`Registration error: ${e.message}`);
    res.status(400).json({ error: "Error Registering contact" });
  }
});

app.get("/verify/:code", async (req, res) => {
  const { code } = req.params;
  const user = await db.get(
    `SELECT * FROM user WHERE verificationCode = ${code}`
  );

  if (user) {
    await db.run(`UPDATE user SET isVerified = 1 WHERE id = ${user.id}`);
    res.send("Email verified Successfully");
  } else {
    res.status(400).send("Invalid verification code");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get(`SELECT * FROM user WHERE email = ${email}`);
  const isPasswordValid = await bcrypt.compare(user.password, password);

  if (!user || !user.isVerified) {
    res.status(403).json({ error: "User not found or Not verified" });
  }

  if (!isPasswordValid) {
    res.status(403).json({ error: "Incorrect password" });
  }
  const jwtToken = jwt.sign(
    { id: user.id, password: user.password },
    "your_jwt_token",
    { expiresIn: "30d" }
  );
  res.json({ jwtToken });
});

app.post("/reset-password/:code", async (req, res) => {
  const { code } = req.params;
  const { email, newPassword } = req.body;

  const user = await db.get(
    `SELECT * FROM user WHERE verificationCode = '${code}'`
  );

  if (!user) {
    return res.status(404).json({ error: "Invalid reset code" });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.run(
    `UPDATE user SET password = '${hashedPassword}' WHERE id = ${user.id}`
  );
  res.json({ message: "Password reset successfully" });
});

app.post("/create-contact/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, address } = req.body;

  const user = await db.get(`SELECT * FROM user WHERE id = ${id}`);

  if (!user) {
    res.status(404).json({ message: "User not found" });
  }

  await db.run(`CREATE TABLE contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL ,
    email TEXT NOT NULL UNIQUE,
    phoneNumber INTEGER NOT NULL UNIQUE,
    address TEXT ,
    timeZone TEXT,
    FOREIGN KEY(userId) REFERENCES user(id)
    )`);

  const timeZone = moment.tz.guess();

  try {
    await db.run(
      `INSERT INTO contact (userId, name, email, phoneNumber, address, timeZone)
        VALUES (?,?,?,?,?,?)
        `,
      [user.id, name, user.email, phoneNumber, address, timeZone]
    );
  } catch (e) {
    if (e.message.includes("UNIQUE constraints failed")) {
      return res.status(400).json({ error: "Contact already exists" });
    }
    console.log(`Create contact error: ${e.message}`);
    res.status(400).json({ error: "Error creating contact" });
  }
});

app.get("/filter-contact/:filter", async function (req, res) {
  const { filter } = req.params;
  const user = await db.get(
    `SELECT * FROM contact WHERE name= ${filter} or email = ${filter} or timeZone = ${filter}`
  );

  if (!user) {
    return res.status(404).json({ message: "No contact found" });
  }

  res.status(200).json({ contact: user });
});

app.put("/update-contact/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, address } = req.body;
  const contact = await db.get(`SELECT * FROM contact WHERE id = ${id}`);

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  try {
    await db.run(
      `UPDATE contact SET name =${name}, phoneNumber =${phoneNumber}, address =${address} WHERE id = ${id}`
    );
    res.status(200).json({ message: "Contact updated successfully" });
  } catch (e) {
    console.log(`Update contact error: ${e.message}`);
    res.status(400).json({ error: "Error updating contact" });
  }
});

