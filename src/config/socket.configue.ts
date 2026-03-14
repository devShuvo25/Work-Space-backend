import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "../app/interface/socket";
import { MessageService } from "../app/modules/messages/massege.service";

export const setupSocket = (server: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`🟢 New Connection: ${socket.id}`);

    // রুম জয়েনিং (roomId মূলত আপনার Conversation ID)
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`📁 Socket ${socket.id} joined room: ${roomId}`);
    });

    // মেসেজ হ্যান্ডলিং
    socket.on("send_message", async (data) => {
      try {
        const savedMessage = await MessageService.saveMessage({
          content: data.content,
          senderId: data.senderId,
          conversationId: data.roomId, // আপনার ইন্টারফেস অনুযায়ী roomId ই conversationId
        });

        // ২. ওই রুমের সবাইকে (নিজেসহ) সেভ হওয়া মেসেজটি পাঠানো
        // io.to ব্যবহার করলে সবাই পাবে, socket.to ব্যবহার করলে প্রেরক বাদে সবাই পাবে
        io.to(data.roomId).emit("receive_message", savedMessage);
        
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // টাইপিং স্ট্যাটাস
    socket.on("start_typing", (data) => {
      socket.to(data.roomId).emit("user_typing", { 
        userId: data.userId, 
        userName: data.userName 
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};