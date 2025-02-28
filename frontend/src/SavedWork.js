import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function SavedWork() {
  const [savedFiles, setSavedFiles] = useState([]);

  useEffect(() => {
    // Fetch saved work from localStorage
    const files = JSON.parse(localStorage.getItem("savedFiles")) || [];
    setSavedFiles(files);
  }, []);

  // Function to clear all saved files
  const clearSavedFiles = () => {
    localStorage.removeItem("savedFiles");
    setSavedFiles([]);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>My Saved Work</h1>
      
      {savedFiles.length === 0 ? (
        <p>No saved work yet.</p>
      ) : (
        <>
          <ul>
            {savedFiles.map((file, index) => (
              <li key={index}>
                <a href={file.url} download={file.name}>
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
          <button 
            onClick={clearSavedFiles} 
            style={{ padding: "10px", marginTop: "10px", backgroundColor: "red", color: "white", border: "none", cursor: "pointer" }}>
            Clear All
          </button>
        </>
      )}

      <br />
      <Link to="/">
        <button style={{ padding: "10px", marginTop: "10px" }}>Back to Home</button>
      </Link>
    </div>
  );
}

export default SavedWork;
