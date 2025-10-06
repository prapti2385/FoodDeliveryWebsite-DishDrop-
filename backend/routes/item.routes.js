import express from "express";
import {
  addItem,
  deleteItem,
  editItem,
  getItemByCity,
  getItemById,
} from "../controllers/item.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);

itemRouter.get("/get-by-id/:itemId", isAuth, getItemById);
itemRouter.get("/delete/:itemId", isAuth, deleteItem);
export default itemRouter;
itemRouter.get("/get-by-city/:city", getItemByCity);
