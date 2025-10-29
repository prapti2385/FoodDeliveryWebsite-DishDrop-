import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://dishdrop.onrender.com",
    credentials: true,
    methods: ["POST", "GET"],
  },
});

app.set("io", io);

app.use(express.json());
app.use(
  cors({
    origin: "https://dishdrop.onrender.com",
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

socketHandler(io);
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
  connectDB();
});
