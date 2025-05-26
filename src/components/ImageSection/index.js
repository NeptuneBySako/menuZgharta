import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { set, ref as dbRef } from "firebase/database";
import * as database from "../../firebase/firebase.config";
const ImageSection = () => {
  const [image, setImage] = useState("");
  const [downloadUrl, setDownloadURL] = useState("");
  const [previewURL, setPreviewURL] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleImageChange = (e) => {
    console.log("123");
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreviewURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpload = () => {
    if (!image) return;
    const storageRef = ref(database?.default?.storage, `images/${image.name}`);
    const uploadTask = uploadBytesResumable(storageRef, image);

    // Listen for upload progress
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress); // Display upload progress
      },
      (error) => {
        alert(error);
      },
      () => {
        // Handle successful uploads on complete
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          saveImageData(url); // Save image URL in the Realtime Database
        });
      }
    );
  };

  const saveImageData = (url) => {
    console.log(image, "image?.name");
    const imageRef = dbRef(database?.default.db, `images/main_image`);
    set(imageRef, {
      imageUrl: url,
    })
      .then(() => {
        // Handle success - image URL successfully saved
        console.log(`image successfully saved to the database!`);
        alert("Image URL saved successfully!");
      })
      .catch((error) => {
        // Handle errors that occurred during saving
        console.error("Error saving image URL to the database:", error);
        alert("Failed to save image. Please try again.");
      });
  };

  return (
    <div>
      <div className="flex flex-col items-start border-b border-b-black w-full p-2">
        <input type="file" onChange={handleImageChange} />
        <button
          className="flex items-center justify-center bg-slate-200 w-full pt-2 pb-2 pl-4 pr-4 mt-3"
          onClick={handleUpload}
        >
          Upload Image
        </button>

        <p>Upload progress: {progress}%</p>
      </div>
      <div className="p-4">
        <img src={previewURL} className="w-full h-full" />
      </div>
    </div>
  );
};

export default ImageSection;
