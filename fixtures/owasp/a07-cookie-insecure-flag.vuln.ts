import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { secure: false, httpOnly: true },
  }),
);
