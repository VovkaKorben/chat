import http from 'http';
import { Server } from 'socket.io';
import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import { asyncHandler, notFound, errorHandler } from './middleware/error.js';
dotenv.config({ quiet: true });
const { API_PORT = 3000, MONGODB_URI } = process.env;

const app = express(); // Перенесено вверх

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Разрешаем запросы с фронтенда
});



// check if MongoDB address is available via .env
if (!MONGODB_URI) {
  console.error('❌ Check MONGODB_URI in .env');
  process.exit(1);
}



mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Ⓜ️  MongoDB connection established");
    // Запускаем единый HTTP-сервер, который держит и Express, и Socket.io
    server.listen(API_PORT, () => {
      console.log(`🐝 Server & Socket.io running on port ${API_PORT}`);
      console.log(`💖 Health check with http://localhost:${API_PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("⛔ MongoDB connection error", err.message);
    process.exit(1);
  });
// MODELS -------------------------------------------------



const RoomsSchema = new mongoose.Schema({
  values: {
    name: { type: String, default: 'Empty room' },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true // Это автоматически добавит поля createdAt и updatedAt [cite: 140]
});
const RoomModel = mongoose.model("rooms", RoomsSchema);

const MessageSchema = new mongoose.Schema({
  values: {
    roomId: { type: String, required: true }, // [добавь это] чтобы отличать сообщения разных комнат
    user: { type: String, default: 'anonymous' },
    message: { type: String, default: '' },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString()
    },
    lastUpdated: { type: Date, default: Date.now }
  }
});
const MessageModel = mongoose.model("message", MessageSchema);







io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Обработка входа в конкретную комнату [cite: 20, 146]
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Юзер ${socket.id} вошел в комнату: ${roomId}`);
  });

  // Получение и рассылка сообщения 
  socket.on('send_message', async (data) => {

    // save message to DB  
    const newMsg = new MessageModel({ values: data });
    const savedMsg = await newMsg.save();

    const flattenedMsg = {
      id: savedMsg._id,
      ...savedMsg.values.toObject()
    };

    io.to(data.roomId).emit('receive_message', flattenedMsg);   // Рассылаем всем в этой комнате, включая отправителя

  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
});



// ROUTES -------------------------------------------------



app.get('/api/health', asyncHandler(async (req, res) => {
  res.status(200).json({ status: 'ok' });
}));

// CREATE room
app.post('/api/rooms', async (req, res) => {
  try {
    const roomData = {};
    if (req.body.name && req.body.name.trim() !== "") {
      roomData.name = req.body.name;
    }
    const newRoom = new RoomModel({
      values: roomData
    });

    const savedRoom = await newRoom.save();
    const resultData = {
      id: savedRoom._id,      // Системный ID, который создала MongoDB 
      name: savedRoom.values.name // Имя из вложенного объекта твоей схемы
    }

    res.status(201).json(resultData);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при создании комнаты", error });
  }
});

// ROOMS List
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await RoomModel.find().select('values.name');
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      name: room.values.name
    }));
    res.json(formattedRooms);
  } catch (error) {
    res.status(500).json({ message: "Не удалось получить список комнат", error });
  }
});
// DELETE room
app.delete('/api/rooms', async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: "ID комнаты не указан" });
    }
    const deletedRoom = await RoomModel.findByIdAndDelete(roomId);
    if (!deletedRoom) {
      return res.status(404).json({ message: "Комната уже удалена или не существует" });
    }
    res.status(200).json({ message: "Комната успешно удалена", id: roomId });
  } catch (error) {
    res.status(500).json({ message: "Ошибка на сервере при удалении", error });
  }
});


// MESSAGES
app.get('/api/chat/:chatID', async (req, res) => {
  try {
    const { chatID } = req.params;

    // Ищем сообщения по roomId
    const messages = await MessageModel.find({ "values.roomId": chatID });

    // Превращаем массив документов в массив плоских объектов
    const flattenedMessages = messages.map(msg => {
      const obj = msg.toObject();
      return {
        id: obj._id,
        ...obj.values
      };
    });

    res.json(flattenedMessages);
  } catch (error) {
    res.status(500).json({ message: "Ошибка загрузки чата", error });
  }
});

app.use(notFound);
app.use(errorHandler);



