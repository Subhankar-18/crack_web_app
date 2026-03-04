import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import "../App.css";

function UploadPage(){

const [filename,setFilename] = useState("");

const navigate = useNavigate();

const handleUpload = async (e)=>{

const file = e.target.files[0];

setFilename(file.name);

const formData = new FormData();

formData.append("image",file);

const res = await axios.post("http://127.0.0.1:5000/upload",formData);

navigate("/result",{
  state:{
    ...res.data,
    filename:file.name
  }
});

};

return(

<div className="app">

<div className="navbar">

<div className="logo">
Crack Detection
</div>

</div>

<div className="upload-container">

<div className="upload-card">

<div className="upload-icon">
📤
</div>

<h2>Upload Crack Image</h2>

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

);

}

export default UploadPage;