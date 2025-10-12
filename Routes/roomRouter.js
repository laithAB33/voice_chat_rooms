import  Express  from "express";
import {verifyToken} from "../middleware/verifyToken.js" ;
import { upload } from "../middleware/multer.js";
import { create,getAll,roomMessage } from "../controller/roomController.js";

let Router = Express.Router();

Router.route('/').post(verifyToken,upload.single('image'),create)
                 .get(verifyToken,getAll);
Router.route('/:roomID/messages').get(verifyToken,roomMessage);
export{Router};