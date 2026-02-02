import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import { asyncHandler, notFound, errorHandler } from './middleware/error.js';
dotenv.config({ quiet: true });


/*dotenv debug
const result = dotenv.config();
if (result.error) console.error('❌ Dotenv error:', result.error);
console.log('📦 Loaded vars:', result.parsed);
*/

const { API_PORT = 3000, MONGODB_URI } = process.env;
// check if MongoDB address is available via .env
if (!MONGODB_URI) {
  console.error('❌ Check MONGODB_URI in .env');
  process.exit(1);
}


const app = express(); // Перенесено вверх

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Ⓜ️  MongoDB connection established");

    const server = app.listen(API_PORT, () => {
      console.log(`💬 Chat API started on http://localhost:${API_PORT}`);
      console.log(`💖 Health check with http://localhost:${API_PORT}/api/health`);
    });
    server.timeout = 12000;
  }).catch((err) => {
    console.error("⛔  MongoDB connection error", err.message);
    process.exit(1);

  });

// MODELS -------------------------------------------------



const RoomsSchema = new mongoose.Schema({
  values: {
    name: { type: String, default: 'Empty room' },
    lastUpdated: { type: Date, default: Date.now }
  }
});
const RoomModel = mongoose.model("rooms", RoomsSchema);

const UserSchema = new mongoose.Schema({
  values: {
    name: { type: String, default: 'Empty room' },
    lastUpdated: { type: Date, default: Date.now }
  }
});
const RoomModel = mongoose.model("rooms", RoomsSchema);
/*
const OutputSchema = new mongoose.Schema({
  values: { type: [[Number]], required: true }, // 13 * количество реальных рядов
  rowCount: { type: Number, required: true },    // количество реальных рядов
  requestedRows: { type: Number, required: true }, // количество заданных рядов
  createdAt: { type: Date, default: Date.now }
});

const OutputModel = mongoose.model("output", OutputSchema);
*/
// ROUTES -------------------------------------------------



// INPUTS load
app.get('/api/rooms', asyncHandler(async (req, res) => {

  const data = await RoomModel.findOne();
  res.json(data ? data.values : []);

}));
// INPUTS save
app.post('/api/input', asyncHandler(async (req, res) => {
  const updateData = {
    values: req.body,
    lastUpdated: new Date()
  };
  await InputModel.findOneAndUpdate({}, updateData, { upsert: true, new: true });
  res.status(200).json({ message: "Успешно сохранено в Atlas" });
}));


app.get('/api/health', asyncHandler(async (req, res) => {

  res.status(200).json({ status: 'ok' });

}));



app.post('/api/output', asyncHandler(async (req, res) => {
  const data = req.body;
  const calculationResult = calculate(data);
  const updateData = {
    values: calculationResult,
    rowCount: calculationResult.length,
    requestedRows: data.rowCount,
    createdAt: new Date()
  };

  // 3. Сохраняем единственный экземпляр (upsert)
  const savedDoc = await OutputModel.findOneAndUpdate(
    {},
    updateData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(savedDoc);

}));



// OUTPUT load ---------------------------------------------------------------
app.get('/api/output', asyncHandler(async (req, res) => {
  const lastResult = await OutputModel.findOne().sort({ createdAt: -1 });
  res.status(200).json(lastResult ? lastResult : null);
}));
// OUTPUT delete ---------------------------------------------------------------
app.delete('/api/output', asyncHandler(async (req, res) => {
  await OutputModel.deleteMany({});
  res.status(200).json({ message: "Таблица результатов успешно очищена" });
}));

// TEAMS load/creation ---------------------------------------------------------------
const generateAndSaveNewSet = async () => {
  const teams = await Team.aggregate([
    { $sample: { size: 26 } },
    { $project: { _id: 1 } }
  ]);
  const rid = teams.map(t => t._id);

  const newMatches = [];
  for (let i = 0; i < rid.length; i += 2) {
    newMatches.push([rid[i], rid[i + 1]]);
  }

  // 3. Сохраняем как единственный документ (upsert)
  return await CurrentTeams.findOneAndUpdate(
    {},
    { matches: newMatches, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};
const populateMatchesData = async (matches) => {
  const allIds = matches.flat();
  const teamsData = await Team.find({ _id: { $in: allIds } }).lean();

  return matches.map(pair => {
    return pair.map(id => {
      const team = teamsData.find(t => t._id.toString() === id.toString());
      // Возвращаем только имя строкой, либо заглушку, если команда не найдена
      return team ? team.name : 'Unknown Team';
    });
  });
};
app.get('/api/teams', asyncHandler(async (req, res) => {
  let set = await CurrentTeams.findOne().lean();

  // Если пусто — генерируем автоматически
  if (!set) {
    const newDoc = await generateAndSaveNewSet();
    set = newDoc.toObject();
  }

  const populatedMatches = await populateMatchesData(set.matches);
  res.json(populatedMatches);
}));
app.post('/api/teamsupdate', asyncHandler(async (req, res) => {
  const set = await generateAndSaveNewSet();
  const populatedMatches = await populateMatchesData(set.matches);
  res.json(populatedMatches);
}));

app.use(notFound);
app.use(errorHandler);



