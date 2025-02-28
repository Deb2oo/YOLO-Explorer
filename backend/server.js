require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    res.set("Access-Control-Allow-Origin", "*");
  },
}));

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/yolo-explorer", {  // Use your own MongoDB URI
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Detection Schema
const detectionSchema = new mongoose.Schema({
  imagePath: String,
  detections: Array,
  timestamp: { type: Date, default: Date.now },
});

// Declare the model once
const Detection = mongoose.model("Detection", detectionSchema);

// Run external Python script
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded!" });

  const imagePath = `uploads/${req.file.filename}`;
  const pythonProcess = spawn("python", ["scripts/yolo_detect.py", imagePath]);

  let resultData = "";

  // Capture Python script output
  pythonProcess.stdout.on("data", (data) => {
    resultData += data.toString();
  });

  // Capture errors
  pythonProcess.stderr.on("data", (data) => {
    console.error(`YOLO Error: ${data}`);
  });

  // Process completed
  pythonProcess.on("close", async (code) => {
    try {
      console.log("Python Output:", resultData); // Debugging purpose
      const detections = JSON.parse(resultData);

      // Save the detection results to MongoDB
      const detectionRecord = new Detection({
        imagePath,
        detections,
      });

      await detectionRecord.save(); // Save the record

      // Send response back to the client
      res.json({ filePath: imagePath, detections });
    } catch (error) {
      console.error("Parsing Error:", error);
      res.status(500).json({ message: "Error processing detection results" });
    }
  });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
