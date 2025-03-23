const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8080/auth/google/callback",
},
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("Google Profile:", profile);
    let user = await User.findOne({ googleId: profile.id });
    console.log("📝 Creating new user:", profile.displayName, profile.emails[0].value);
    if (!user) {
      console.log("Creating new user:", profile.displayName, profile.emails[0].value);
      user = await User.create({
        googleId: profile.id,  // Ensure googleId is a string
        name: profile.displayName,
        email: profile.emails[0].value,
      });
      console.log("New User Created:", user); // ✅ Log the newly created user
        } else {
          console.log("User already exists:", user); // ✅ Log existing user
        }

        return done(null, user);
      } catch (err) {
        console.error("Error during authentication:", err.message);
        return done(err, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.googleId);
});
passport.deserializeUser(async (googleId, done) => {
      const user = await User.findOne({ googleId });
      done(null, user);
  });