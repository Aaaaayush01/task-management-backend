const jwt = require("jsonwebtoken");
const SECRET = "secret123";
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let users = [];

app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ msg: "User already exists" });
  }

  users.push({ email, password });

  res.json({ msg: "Signup successful" });
});

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });

  res.json({ msg: "Login successful", token });
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
};
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ msg: "Welcome to dashboard", user: req.user });
});

let tasks = [];
app.post("/tasks", verifyToken, (req, res) => {
  const { text } = req.body;

  const newTask = {
    id: Date.now(),
    text,
    user: req.user.email
  };

  tasks.push(newTask);

  res.json({ msg: "Task added", task: newTask });
});