const express =require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const { Server } = require("socket.io");
const http = require("http");
const sendSmsAlert = require("./alertService"); require("./passportConfig");
const dotenv = require("dotenv");
const twilio = require('twilio')
dotenv.config();
const cors = require("cors");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Middlewares
app.use(express.json());
app.use( cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/kuldeepdb ",
      collectionName: "sessions",
    }),
    cookie: { secure: false }, // Set to true if using https
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/kuldeepdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Database connection error:", err));

// WebSocket Setup
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Schema for Heart Rate
const heartRateSchema = new mongoose.Schema({
  userId: String,
  heartRate: Number,
  timestamp: { type: Date, default: Date.now },
});

const HeartRate = mongoose.model("HeartRate", heartRateSchema);

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Heart Alerting App!");
});

// Google OAuth Login

app.get("/login", (req, res) => {
  res.send('<h2>Login Page</h2><a href="/auth/google">Login with Google</a>');
});


app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.send("Logged in successfully");
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Heart Rate Endpoint
app.post("/api/heart-rate", async (req, res) => {
  const { userId, heartRate, phoneNumber } = req.body;
  
  // Save to Database
  const newReading = new HeartRate({ userId, heartRate });
  await newReading.save();
  return res.status(200).json({message: "heart rate processed."});
});
  // // Save to Database
  // const newReading = new HeartRate({ userId, heartRate });
  // await newReading.save();


  
// API Route to receive heart rate readings
app.post("/api/heartbeat", (req, res) => {
    const { name, age, gender, contact, heartRate} = req.body;

    if ( !name || !age || !gender || !contact || !heartRate ) {
        return res.status(400).json({ error: "Missing heart rate or phone number" });
    }
    
    console.log("Recieved heart rate data:", req.body);
    let message = `Your heart rate is normal: ${heartRate} BPM. Stay healthy!`;

    // Define abnormal heart rate range
    if (heartRate < 80 || heartRate > 120) {
        message = `Alert! Abnormal heart rate detected: ${heartRate} BPM. Seek medical advice if needed.`;
        
        // Send Twilio SMS for abnormal heart rate
        client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: userPhone
        })
        .then(() => console.log("Alert SMS sent successfully!"))
        .catch(err => console.error("Twilio Error:", err));
    }

    res.json({ message: "Heart rate processed", status: message });
});

  
  // Emit Real-Time Updates
  //io.emit("heartRateUpdate", { userId, heartRate, timestamp: newReading.timestamp });
  //res.status(200).json({ message: "Heart rate data saved successfully." });


// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

// Google OAuth Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: "1021500512725-4o6ji3ne7hmmmsja4lv0u2126s49ppj8.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Handle user authentication
      return done(null, profile);
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Example route to set and access session data
app.get("/session-test", (req, res) => {
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  res.send(`You have visited this page ${req.session.views} times`);
});



app.use(
  session({
    secret: "your-session-secret", // Use a secure secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, "YOUR_SECRET_KEY");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
}

// Apply middleware
app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, welcome to Dashboard` });
});



