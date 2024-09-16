import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { connectToMongoDB } from "./services/mongodb";
import { getOrCreateUser } from "./services/user-management-service";
import { getMessagesByRoom, saveMessage } from "./services/message-management-service";

dotenv.config();

connectToMongoDB();

const app = express();

app.use(cors()); // Add cors middleware

const server = http.createServer(app); // Add this

// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const CHAT_BOT = "ChatBot";

type ActiveUserInfo = {
  socketId: string;
  username: string;
  room: string;
};

type JoinRoomData = {
  username: string;
  room: string;
};

type SendMessageData = {
  username: string;
  room: string;
  message: string;
  __createdtime__: number;
};

let chatRoom = ""; // E.g. javascript, node,...
let allActiveUsers: ActiveUserInfo[] = []; // All users in current chat room

function leaveRoom(socketId: string, chatRoomUsers: ActiveUserInfo[]) {
  return chatRoomUsers.filter((user) => user.socketId != socketId);
}

// Listen for when the client connects via socket.io-client
io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);

  // Add a user to a room
  socket.on("join_room", (data: JoinRoomData) => {
    const { username, room } = data; // Data sent from client when join_room event emitted
    const userDetails = getOrCreateUser(username);
    socket.join(room); // Join the user to a socket room

    let __createdtime__ = Date.now(); // Current timestamp
    // Send message to all users currently in the room, apart from the user that just joined
    socket.to(room).emit("receive_message", {
      message: `${username} has joined the chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });
    // Send welcome msg to user that just joined chat only
    socket.emit("receive_message", {
      message: `Welcome ${username}`,
      username: CHAT_BOT,
      __createdtime__,
    });
    // Save the new user to the room
    chatRoom = room;
    allActiveUsers.push({ socketId: socket.id, username, room });
    const chatRoomUsers = allActiveUsers.filter((user) => user.room === room);
    socket.to(room).emit("chatroom_users", chatRoomUsers);
    socket.emit("chatroom_users", chatRoomUsers);

    // Get last 100 messages sent in the chat room
    getMessagesByRoom(room)
      .then((last100Messages) => {
        // console.log('latest messages', last100Messages);
        const messages = last100Messages.map((message) => {
          return {
            username: message.username,
            message: message.message,
            __createdtime__: message.__createdtime__,
          };
        })
        socket.emit("last_100_messages", JSON.stringify(messages));
      })
      .catch((err) => console.log(err));
  });

  socket.on("send_message", (data: SendMessageData) => {
    const { message, username, room, __createdtime__ } = data;
    io.in(room).emit("receive_message", data); // Send to all users in room, including sender
    saveMessage(message, username, room, __createdtime__) // Save message in db
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  });

  socket.on("leave_room", (data) => {
    const { username, room } = data;
    socket.leave(room);
    const __createdtime__ = Date.now();
    // Remove user from memory
    allActiveUsers = leaveRoom(socket.id, allActiveUsers);
    socket.to(room).emit("chatroom_users", allActiveUsers);
    socket.to(room).emit("receive_message", {
      username: CHAT_BOT,
      message: `${username} has left the chat`,
      __createdtime__,
    });
    console.log(`${username} has left the chat`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from the chat");
    const user = allActiveUsers.find((user) => user.socketId == socket.id);
    if (user?.username) {
      allActiveUsers = leaveRoom(socket.id, allActiveUsers);
      socket.to(chatRoom).emit("chatroom_users", allActiveUsers);
      socket.to(chatRoom).emit("receive_message", {
        message: `${user.username} has disconnected from the chat.`,
      });
    }
  });
});

server.listen(4000, () => "Server is running on port 4000");
