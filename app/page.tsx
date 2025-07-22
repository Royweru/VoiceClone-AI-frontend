"use client";
import { useState, useRef } from "react";
import TrainModelTab from "@/components/trainModelTab";
import TextToSpeechTab from "@/components/textToSpeechTab";
import SpeechToSpeechTab from "@/components/speechToSpeechTab";
import { useAuth } from "@/components/providers/authContext";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"train" | "sts" | "tts">("tts");
  const { user, logout,loading} = useAuth();
  const [taskId, setTaskId] = useState<string|null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const recorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
 
  return (
    <div className="max-w-6xl px-7 md:px-5 mx-auto pt-16 pb-10">
      <nav
        className=" mb-4 w-full shadow-sm bg-white border-neutral-800 border-b-[1px]
       items-center flex justify-between py-7 px-2  text-neutral-900"
      >
        {user && !loading ? (
          <div>
            <h3 className=" text-lg font-semibold">
              {user.username}
            </h3>
          </div>
        ) : (
          <div>
            <h3 className=" text-base font-semibold font-mono">
              Hey there welcome to voiceAi
            </h3>
          </div>
        )}
        {user && !loading ? (
          <div className=" relative">
            <button 
            className=" py-2 px-6 font-semibold 
            rounded bg-rose-500 text-white"
            onClick={logout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className=" flex items-center justify-center gap-x-4">
            <Link href={"/login"}>
              <button className=" py-2 px-6 font-semibold rounded bg-neutral-500 shadow-sm text-white">
                Login
              </button>
            </Link>
            <Link href={"/register"}>
              <button className=" py-2 px-6 font-semibold rounded bg-blue-500 text-white">
                Register
              </button>
            </Link>
          </div>
        )}
      </nav>

      <h1 className="text-3xl font-bold mb-6">Voice Cloning App</h1>
      <div className="tabs mb-6 gap-x-5 flex">
        <button
          className={`tab px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === "train"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("train")}
        >
          Train Model
        </button>
        <button
          className={`tab px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === "tts"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("tts")}
        >
          Text-to-Speech
        </button>
        <button
          className={`tab px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === "sts"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("sts")}
        >
          Speech-to-Speech
        </button>
      </div>

      {activeTab === "train" && (
        <TrainModelTab taskId={taskId} setTaskId={setTaskId} />
      )}
      {activeTab === "tts" && (
        <TextToSpeechTab audioUrl={audioUrl} setAudioUrl={setAudioUrl} />
      )}
      {activeTab === "sts" && (
        <SpeechToSpeechTab
          audioUrl={audioUrl}
          setAudioUrl={setAudioUrl}
          convertedText={convertedText}
          setConvertedText={setConvertedText}
          recorderRef={recorderRef}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      )}
    </div>
  );
}
