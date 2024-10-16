import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, //which frontend is allowed
    credentials: true, // for allowing the cookies and authentication
  })
);
app.use(express.json({ limit: "16kb" })); // for accepting the data from (Apis, axios, fetch, form, get post etc)
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // designed for url data such as form data
app.use(express.static("public")); // public assets to access static files
app.use(cookieParser());


export { app };