import React, { useState } from "react";
import axios from "axios";

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [chart, setChart] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setImage(file);

    const formData = new FormData();
    formData.append("image", file);

    const res = await axios.post("http://127.0.0.1:5000/upload", formData);

    setResult("data:image/jpeg;base64," + res.data.image);
    setPrediction(res.data.prediction);
    setChart("data:image/png;base64," + res.data.chart);
  };

  return (
    <div style={{ padding: 20, background: "#222", color: "white" }}>
      <h1>Crack Detection System</h1>

      <input type="file" onChange={handleUpload} />

      {result && (
        <>
          <h2>Detected Crack</h2>
          <img src={result} width="400" />

          <h3>Prediction: {prediction.toFixed(2)} mm</h3>

          <img src={chart} width="400" />
        </>
      )}
    </div>
  );
}

export default App;
