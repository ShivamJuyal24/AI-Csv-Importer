import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.route";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin:[
    "http://localhost:3000",
    "https://ai-csv-importer-steel.vercel.app/"
  ]
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/upload", uploadRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});