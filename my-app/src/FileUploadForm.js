import React, { useState } from "react";
import AWS from 'aws-sdk';

function FileUploadForm() {
  const [inputFileName, setInputFileName] = useState("")
  const [inputText, setInputText] = useState("");
  const [inputFile, setInputFile] = useState(null);

  function handleInputTextChange(event) {
    setInputText(event.target.value);
  }

  async function handleInputFileChange(event) {
    const file = event.target.files[0];
    setInputFileName(file.name)
    const reader = new FileReader();
    reader.readAsText(file);

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
    })
    .then((fileContent) => {
      setInputFile(fileContent);
    })
    .catch((error) => {
      console.error(error);
    });
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const headers = { 'Content-Type': 'application/json' };

    const params = {
      Bucket: process.env.REACT_APP_BUCKET_NAME,
      Key: inputFileName,
      Body: inputFile,
    };

    console.log(process.env.REACT_APP_IDENTITY_POOL_ID)
   // Initialize the Amazon Cognito credentials provider
    AWS.config.region = process.env.REACT_APP_REGION; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    });

    AWS.config.credentials.get(async (err) => {
      if (err) {
        console.error(err);
        return;
      }
      
      console.log(AWS.config.credentials);

      const s3 = new AWS.S3();
      try {
        const response = await s3.upload(params).promise();
        console.log(`File uploaded successfully to ${response.Location}`);
      } catch (error) {
        console.error(error);
      }

      try {
        const url = process.env.REACT_APP_API_GATEWAY_POST;
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "body": `{\"inputText\": \"${inputText}\", \"inputFilePath\": \"filefovusbucket/${inputFileName}\"}`
          }),
        };
        const response = await fetch(url, options);
        console.log(`API response: ${JSON.stringify(await response.json())}`);
      } catch (error) {
        console.error(error);
      }
    });
    
  };

  return (

    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="inputText" className="block text-gray-700 font-bold mb-2">
          Input Text
        </label>
        <input
          id="inputText"
          type="text"
          value={inputText}
          onChange={handleInputTextChange}
          className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="inputFile" className="block text-gray-700 font-bold mb-2">
          Input File
        </label>
        <input
          id="inputFile"
          type="file"
          onChange={handleInputFileChange}
          className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Submit
      </button>
    </form>
  
  );
}
export default FileUploadForm;
