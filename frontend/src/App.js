import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import "./styles.css";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [detections, setDetections] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setCapturedImage(null); // Reset captured image when file is selected
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request camera access
        setIsCameraOn(true);
      } catch (error) {
        alert("Please grant camera permission to use this feature.");
      }
    } else {
      setIsCameraOn(false);
    }
  };

  // Capture image from webcam
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setPreview(imageSrc);
      setFile(null); // Reset file upload when capturing
    }
  };

  // Handle file/captured image upload
  const handleUpload = async () => {
    if (!file && !capturedImage) {
      alert("Please select or capture an image first.");
      return;
    }

    setLoading(true); // Start loading

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else if (capturedImage) {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      formData.append("file", blob, "captured-image.png");
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData
      );
      alert("File uploaded successfully!");
      console.log("Upload Response:", response.data);
      setImagePath(response.data.filePath);
      setDetections(response.data.detections);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (!imagePath || detections.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = `http://localhost:5000/${imagePath}`;


    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      detections.forEach((det) => {
        const [x, y, w, h] = det.bbox;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w - x, h - y);
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(det.label, x, y - 5);
      });
    };
  }, [imagePath, detections]);

  // Handle image download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fileName = "detected_image.png";
    const fileUrl = canvas.toDataURL("image/png");

    // Save file info in localStorage
    const existingFiles = JSON.parse(localStorage.getItem("savedFiles")) || [];
    const updatedFiles = [...existingFiles, { name: fileName, url: fileUrl }];
    localStorage.setItem("savedFiles", JSON.stringify(updatedFiles));

    // Trigger download
    const link = document.createElement("a");
    link.download = fileName;
    link.href = fileUrl;
    link.click();
  };

  return (
    <div className="app-container">
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>YOLO Explorer: Object Detection</h1>

        {/* File Upload Option */}
        <input type="file" onChange={handleFileChange} accept="image/*" />

        <h3>OR</h3>

        {/* Webcam Capture Option */}
        {isCameraOn && (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/png"
            width="100%"
            height="auto"
          />
        )}

        <div>
          <button
            onClick={toggleCamera}
            style={{ margin: "10px", padding: "10px" }}
          >
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </button>

          <button
            onClick={captureImage}
            style={{ margin: "10px", padding: "10px" }}
            disabled={!isCameraOn}
          >
            Capture from Camera
          </button>
        </div>

        {/* Preview Selected/Captured Image */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{ width: "300px", marginTop: "10px" }}
          />
        )}

        <br />
        <button className="button" onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Detect"}
        </button>

        {/* Loading Spinner */}
        {loading && <p>Processing image... Please wait.</p>}

        <div className="branding">
          <h1>Credit</h1>
          <h2>Developed by Debjyoti Adak | B.Tech CSE, Haldia Institute of Technology</h2>
        </div>

        <div className="about-project">
          <h3>About This Project</h3>
          <p>
            This AI-powered web application detects objects in images using a YOLOv8 model.
            You can upload an image or capture one using your webcam, and the model will analyze and highlight detected objects.
          </p>
        </div>

        <div className="footer">
          <p>Developed by <b>Debjyoti Adak</b> | Haldia Institute of Technology | 2026</p>
        </div>

        <Link to="/saved-work">
          <button style={{ margin: "10px", padding: "10px" }}>
            Go to Saved Work
          </button>
        </Link>

        {imagePath && (
          <div>
            <h3>Detection Result:</h3>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: "100%", border: "1px solid black" }}
            />
          </div>
        )}

        {detections.length > 0 && (
          <div>
            <h3>Detected Objects:</h3>
            <ul>
              {detections.map((det, index) => (
                <li key={index}>
                  <strong>{det.label}</strong> (Confidence: {(det.confidence * 100).toFixed(2)}%)
                </li>
              ))}
            </ul>
          </div>
        )}

        {imagePath && (
          <button
            onClick={handleDownload}
            style={{ marginTop: "10px", padding: "10px" }}
          >
            Download Detected Image
          </button>
        )}
      </div>
    </div>
  );
}

export default App;