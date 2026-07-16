import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { secure: true, httpOnly: true, sameSite: "lax" },
  }),
);
