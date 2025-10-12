import "dotenv/config";
import Express from "express";
import mongoose from "mongoose"; 
import { createServer } from 'http';
import { Server } from 'socket.io';
import  Cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { globalErrorHandler } from "./controller/globalErrorHandler.js";
import {Router as userRouter} from './Routes/userRouter.js'
import { Router as roomRouter } from "./Routes/roomRouter.js";
import { socketAuth } from "./sokect.IO/socketAuth.js";
import { Room } from "./modules/roomSchema.js";
import { socketWrapper } from "./middleware/asyncWrapper.js";
import { AppError } from "./utils/appError.js";
import { Message } from "./modules/messageSchema.js";

let app = Express(),
    port = process.env.PORT || 3000;

let http = createServer(app),
    io = new Server(http, {
        cors: {
            origin: "*",
            credentials: true,
            allowedHeaders:["content-Type"]
          }
    });

mongoose.connect(process.env.MONGODB_CONNECT_STR)
.then(()=>{
    console.log("mongodb connected successfly");
}).catch((err)=>{
    console.log("mongodb connection error",err);
})

app.use(
    Cors({credentials:true})
);
app.use(Express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//end point
app.use('/api/user',userRouter);
app.use('/api/room',roomRouter);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

io.use(socketAuth);

let connectedUsers = new Map(); //socketID : userData
let userRooms = new Map(); // userID : roomID

io.on('connection',socketWrapper((socket)=>{

    console.log(`client is connected userName ${socket.userName} conection: ${socket.id}`);

    connectedUsers.set(socket.id,{
        userName:socket.userName,
        userID : socket.userID,
        profileImage:socket.profileImage,
        connectAt:new Date(),
    })

    socket.on('join-room',async(roomID,role)=>{

        console.log(`${socket.userName} tried to enter ${roomID}`);

        if(!roomID)throw new AppError("the room is requied",400,"fail");

        let room = await Room.findById(roomID);
        
        if(!room) throw new AppError("the room not found",400,"fail");

        if(room.isFull())
                    throw new AppError("the room is full",400,"fail");

        await room.addPerson(socket.userID);

        socket.join(roomID);

        socket.currentRoom = roomID;

        connectedUsers.get(socket.id).currentRoom = roomID;

        const messages = await Message.find({roomID})
            .populate("userID","userName profileImage")
            .sort({createdAt: -1})
            .limit(50)
            .lean();  // only read less time

        const systemMessage = new Message({
            roomID,
            userID:socket.userID,
            userName:'system',
            message: `${socket.userName} joined the group`,
            messageType: 'text'
        })

        await systemMessage.save();

        socket.emit('room-joined',{
            success:true,
            room:{
                id:roomID,
                name:room.name,
                description:room.description,
                participants:room.participants,
                participantCount:room.participants.length,
            },
            messages,
            systemMessage:{
                id:systemMessage._id,
                message:systemMessage.message,
            }

        })

        socket.to(roomID).emit('user-joined',{
            userName:socket.userName,
            messages:`${socket.userName} joined the group`,
            timestamps:new Date(),
            participants:room.participants,
        })


    })

    // socket.on('message',(data)=>{

    //     data = JSON.parse(data);

    //     console.log("message is "+ data.text);

    //     io.emit('message', data);
    // })
    

    // socket.on("userTyping",(data)=>{

    //     console.log("user typing: " + data);
        
    //     socket.broadcast.emit('userTyping', data);
        
    // })
    
    // socket.on('disconnect',()=>{
    //     console.log("disconnected: " + socket.id);
    // })
}))




///////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(globalErrorHandler);

app.use((req,res)=> {
    res.status(404).json({
        success:false, 
        status:"fail", 
        message: "this resourse is not available", 
        data:null,
    });
})


http.listen(port,()=>{
    console.log(`listening on port ${port}`);
})
