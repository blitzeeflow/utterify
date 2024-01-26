import React, { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { DEFAULT_SPEAKER, SPEAKERS } from "./constants";
let blobUrl;
function App() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [ready, setReady] = useState(null);
  const [progressItems, setProgressItems] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState(DEFAULT_SPEAKER);
  // Create a reference to the worker object.
  const worker = useRef(null);
  const audio = useRef(null);
  const [text, setText] = useState("");

  // We use the `useEffect` hook to setup the worker as soon as the `App` component is mounted.
  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "initiate":
          // Model file start load: add a new progress item to the list.
          setReady(false);
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress };
              }
              return item;
            })
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file)
          );
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setReady(true);
          break;

        case "complete":
          // // Generation complete: re-enable the "Translate" button
          setDisabled(false);
          setShowOverlay(false);
          blobUrl = URL.createObjectURL(e.data.output);
          audio.current.src = blobUrl;
          console.log("complete");
          audio.current.play();
          // setOutput(blobUrl);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  const handleGenerateSpeech = () => {
    setShowOverlay(true);
    worker.current.postMessage({
      text,
      speaker_id: selectedSpeaker,
    });
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <span className="logo material-symbols-outlined ">graphic_eq</span>
          <span>Utterify</span>
        </div>
        <div className="content">
          <textarea
            onInput={(event) => {
              console.log(event.target.value);
              setText(event.target.value);
            }}
            placeholder={`Utterify helps millions of teachers around the world save time and increase their productivity.

Use it to grade essays, listen to papers, and get through reading materials much faster without any fatigue. It works everywhere you need it to - Google Docs, PDFs, MS Word and on any other website.`}
          ></textarea>
        </div>
        <div className="footer">
          <button
            className="download"
            onClick={() => {
              if (!blobUrl) return;
              var a = document.createElement("a");
              document.body.appendChild(a);
              a.style = "display: none";
              a.href = blobUrl;
              a.download = `utterify.mp3`;
              a.click();
            }}
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          <button className="play-button" onClick={handleGenerateSpeech}>
            <span className="material-symbols-outlined play-icon">
              play_arrow
            </span>
          </button>

          <select
            id="speaker"
            className="border border-gray-300 rounded-md p-2 w-full"
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
          >
            {Object.entries(SPEAKERS).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
          <audio ref={audio}></audio>
        </div>
        <div className={`overlay ${showOverlay ? "" : "hide"}`}>
          <span className="logo white material-symbols-outlined ">
            graphic_eq
          </span>
          <div>
            <span>Generating</span>
            <p>
              If this is your first time using it, loading the generator may
              take a bit longer, as this app operates entirely within the
              browser.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
