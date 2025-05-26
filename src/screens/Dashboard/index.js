import React, { useState } from "react";
import Items from "../../components/Items";
import Categories from "../../components/Categories";
import { useNavigate } from "react-router-dom";
import Sections from "../../components/Sections";
import ImageSection from "../../components/ImageSection";
const Dashboard = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);

  const login = () => {
    console.log(username, "username");
    if (username === "admin" && password === "neptune123") {
      setIsLoggedIn(true);
    } else {
      alert("Wrong username or password");
    }
  };
  return (
    <div className="p-5">
      <div className="w-full items-end justify-end flex">
        <button
          className="p-2 bg-slate-300 mb-5"
          onClick={() => {
            setUsername("");
            setPassword("");
            setIsLoggedIn(false);
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>
      {!isLoggedIn ? (
        <div className="flex flex-col items-start p-3 border border-black w-fit">
          <h2>Login</h2>
          <input
            type="text"
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            placeholder="Username"
            className="mt-3 mb-3 border p-2"
          />

          <input
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            className="mt-3 mb-3 border p-2"
          />

          <button
            className="flex items-center justify-center bg-slate-200 w-full p-2"
            onClick={() => {
              login();
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div className="w-full h-auto border border-black">
          <div className="flex items-center justify-between w-full p-1 border-b border-b-black ">
            <button
              className="ml-3 p-2 w-full"
              style={{
                backgroundColor: selectedTab === 0 ? "#C4C4C4" : "transparent",
              }}
              onClick={() => {
                setSelectedTab(0);
              }}
            >
              Sections
            </button>
            <button
              className="ml-3 p-2 w-full"
              style={{
                backgroundColor: selectedTab === 1 ? "#C4C4C4" : "transparent",
              }}
              onClick={() => {
                setSelectedTab(1);
              }}
            >
              Categories
            </button>
            <button
              className="ml-3 p-2 w-full"
              style={{
                backgroundColor: selectedTab === 2 ? "#C4C4C4" : "transparent",
              }}
              onClick={() => {
                setSelectedTab(2);
              }}
            >
              Items
            </button>
            <button
              className="ml-3 p-2 w-full"
              style={{
                backgroundColor: selectedTab === 3 ? "#C4C4C4" : "transparent",
              }}
              onClick={() => {
                setSelectedTab(3);
              }}
            >
              Main Image
            </button>
          </div>
          <div>
            {selectedTab === 0 ? (
              <Sections />
            ) : selectedTab === 2 ? (
              <Items />
            ) : selectedTab === 1 ? (
              <Categories />
            ) : (
              <ImageSection />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
