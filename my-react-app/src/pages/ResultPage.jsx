import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../App.css";

function ResultPage(){

const location = useLocation();
const navigate = useNavigate();

const data = location.state;


const [filename,setFilename] = useState(data?.filename || "");

const handleUpload = async (e)=>{

const file = e.target.files[0];

setFilename(file.name);

const formData = new FormData();

formData.append("image",file);

const res = await axios.post("http://127.0.0.1:5000/upload",formData);

navigate("/result",{state:{...res.data,filename:file.name}});

};

if(!data){
return <h2 style={{color:"white"}}>No result available</h2>;
}

return(

<div className="app">

<div className="navbar">

<div className="logo">
Crack Detection
</div>

</div>

<div className="dashboard">

<div className="card detect-card">

<h2>Detected Crack</h2>

<div className="detect-body">

<div className="image-box">

<img
src={"data:image/jpeg;base64,"+data.image}
alt="result"
/>

</div>

<div className="upload-box">

<label className="upload-btn">
Upload Image
<input type="file" onChange={handleUpload} hidden/>
</label>

{filename && (

<div className="file-card">
📄 {filename}
</div>

)}

</div>

</div>

</div>

<div className="card prediction-card">

<h2 className="prediction-title">

Prediction:

<span>
{data.prediction.toFixed(2)} mm
</span>

</h2>

<div className="chart-card">

<h3>Crack Growth Prediction</h3>

<img
src={"data:image/png;base64,"+data.chart}
alt="chart"
/>

</div>

</div>

</div>

</div>

);

}

export default ResultPage;