import React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Paragraph, Button } from "grommet";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Upload, Spotify } from "grommet-icons";
import pulseBPMglow from "../Images/pulseBPMglow.png";
import { Buffer } from "buffer";
import FileModal from "./FileModal";
import SpotifyForm from "./SpotifyForm";

const CLIENT_ID: string | undefined = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET: string | undefined = process.env.REACT_APP_CLIENT_SECRET;

export default function BPMDetectMain() {
  //------------------------------------------- STATE && VARIABLES ------------------------------------------- //

  const [selectedFile, setSelectedFile] = useState<null | Blob>(null);
  const [examinedAudio, setexaminedAudio] = useState<{
    audio: null | ArrayBuffer;
  }>({ audio: null });
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [fileData, setFileData] = useState<{
    fileName: string;
    fileLastModified: number;
    fileType: string;
  }>({
    fileName: "",
    fileLastModified: 0,
    fileType: "",
  });
  const [beatsPerMinute, setBeatsPerMinute] = useState<number>(0);
  const [otherBeatsPerMinuteGuesses, setOtherBeatsPerMinuteGuesses] = useState<
    { tempo: number; count: number }[]
  >([]);
  const [songDuration, setSongDuration] = useState<string>("");
  const [samples, setSamples] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [isUIElementsOpen, setIsUIElementsOpen] = useState<{
    isFileBoxOpen: boolean;
    isSpotifyBoxOpen: boolean;
    isFileSubmitted: boolean;
  }>({
    isFileBoxOpen: true,
    isSpotifyBoxOpen: false,
    isFileSubmitted: false,
  });
  const [isFileSubmitted, setIsFileSubmitted] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [trackInfo, setTrackInfo] = useState<{
    trackId: string;
    trackName: string;
    artist: string;
    preview: string | any;
    albumArt: string;
  }>({
    trackId: "",
    trackName: "",
    artist: "",
    preview: "",
    albumArt: "",
  });
  const [token, setToken] = useState<string>("");
  const [isSpotifyLoaded, setIsSpotifyLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  let navigate = useNavigate();
  //------------------------------------------- REFS -------------------------------------------//

  const fileBoxRef = useRef<any>(null);
  const waveRef = useRef<any>({
    isPlaying: () => false,
  });
  const containerRef = useRef<any>(null);

  //------------------------------------------- FUNCTIONS && CALCULATIONS -------------------------------------------//
  const findPeaks = (data: any[]): { position: number; volume: number }[] => {
    //Divide audio into parts, identify loudest part, and take loudest half
    const sectionSize: number = 22050;
    const peaks: { position: number; volume: number }[] = [];
    const parts: number = data[0].length / sectionSize;
    for (let i = 0; i < parts; i++) {
      let max = {
        position: 0,
        volume: 0,
      };
      for (let j = i * sectionSize; j < (i + 1) * sectionSize; j++) {
        const volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
        if (!max || volume > max.volume) {
          max = {
            position: j,
            volume: volume,
          };
        }
      }
      peaks.push(max);
    }
    //Sort according to volume
    peaks.sort((a, b) => {
      return b.volume - a.volume;
    });
    let loudestHalf = peaks.splice(0, peaks.length * 0.5);
    //Sort again based on pos
    loudestHalf.sort((a, b) => {
      return a.position - b.position;
    });
    return loudestHalf;
  };

  const getIntervals = (
    peaks: { position: number; volume: number }[]
  ): { tempo: number; count: number }[] => {
    const groups: { tempo: number; count: number }[] = [];
    peaks.forEach((peak, index) => {
      for (let i = 1; index + i < peaks.length && i < 10; i++) {
        let group = {
          tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
          count: 1,
        };
        while (group.tempo < 90) {
          group.tempo *= 2;
        }
        while (group.tempo > 180) {
          group.tempo /= 2;
        }
        group.tempo = Math.round(group.tempo);
        if (
          !groups.some(function (interval) {
            return interval.tempo === group.tempo ? interval.count++ : 0;
          })
        ) {
          groups.push(group);
        }
      }
    });
    return groups;
  };

  //------------------------------------------- INITIALIZING WAVESURFER && CLEANUP -------------------------------------------//

  useEffect(() => {
    //creates an instance of WaveSurfer any time that state of selectedFile changes (user chooses a different file) and cleans up other instances
    const waveSurfInstance = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#D3D3D3",
      progressColor: "#f062a9",
      fillParent: true,
    });
    if (selectedFile) {
      waveSurfInstance.loadBlob(selectedFile);
    }
    if (trackInfo.preview) {
      waveSurfInstance.load(trackInfo.preview);
    }

    //spotify previews are 30 seconds long hence the 29...so if uploaded file is less than or equal to 29 seconds in length, instance will be destroyed
    waveSurfInstance.on("ready", () => {
      waveRef.current = waveSurfInstance;
      const playButton = document.getElementById("play-btn");
      playButton?.classList.add("play-btn-show");
      const duration = waveSurfInstance.getDuration();
      if (duration <= 29) {
        waveSurfInstance.destroy();
        playButton?.classList.remove("play-btn-show");
      }
    });

    return () => {
      waveSurfInstance.destroy();
    };
  }, [selectedFile, trackInfo.preview]);

  const handlePlayer = () => {
    waveRef.current.playPause();
    setIsAudioPlaying(waveRef.current.isPlaying());
  };

  //------------------------------------------- PRIMARY HANDLING OF AUDIO FILES ON CHANGE -------------------------------------------//

  //Prepare inputted file for WaveSurfer loadBlob method and store in state
  //-if statement is to guard against unwanted file types even though "accept = '.mp3,.wav'" used on input field

  const processSubmittedFile = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      let blob = new window.Blob([new Uint8Array(e.target.result)]);
      if (file.type === "audio/mpeg" || file.type === "audio/wav") {
        setSelectedFile(blob);
        setexaminedAudio({
          audio: e.target.result,
        });
        setIsUIElementsOpen({
          isFileSubmitted: true,
          isSpotifyBoxOpen: false,
          isFileBoxOpen: false,
        });
        setIsFileSubmitted(true);
        openThenCloseSuccessModal();
      } else {
        setIsModalOpen(true);
        setModalMessage("Uploaded file must be an .mp3 or .wav file.");
      }
    };
    reader.readAsArrayBuffer(file);
    reader.onerror = (e: any) => {
      setIsError(true);
      setIsModalOpen(true);
      setModalMessage("Something messed up.");
    };
  };

  const onChangeAudioFile = (e: any): void => {
    const file = e.target.files[0];
    setFileData({
      fileName: file.name,
      fileLastModified: file.lastModified,
      fileType: file.type,
    });
    processSubmittedFile(file);
  };

  const handleDropFile = (e: any): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileData({
        fileName: file.name,
        fileLastModified: file.lastModified,
        fileType: file.type,
      });
      processSubmittedFile(file);
    }
  };

  ///ANY TIME AUDIO FILE CHANGES, PASS IT THROUGH DECODE AUDIO DATA, FILTERS, AND BPM CALCULATING FUNCTIONS
  useEffect(() => {
    if (examinedAudio.audio) {
      const OffLineAudioContext = window.OfflineAudioContext;
      const audioContext = new OffLineAudioContext(2, 30 * 44100, 44100);

      audioContext.decodeAudioData(
        examinedAudio.audio,
        (buffer: AudioBuffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;

          const duration = buffer.duration;
          const minutes = Math.floor((duration % 3600) / 60);
          const seconds = Math.floor((duration % 3600) % 60);
          const timeFormat =
            ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
          setSongDuration(timeFormat);

          if (duration > 30 && duration < 600) {
            //Objective with the filters is to EQ everything out except for the kick drum, which is best for finding BPM, especially in electronic music.
            //Low pass to filter out everything above 150hz & run source through the low pass
            const lowPass = audioContext.createBiquadFilter();
            lowPass.type = "lowpass";
            lowPass.frequency.value = 150;
            lowPass.Q.value = 1;
            source.connect(lowPass);

            //high pass filter to remove sub bass (below 100hz) run buffer source through the high pass and final output through audio context
            const highPass = audioContext.createBiquadFilter();
            highPass.type = "highpass";
            highPass.frequency.value = 100;
            highPass.Q.value = 1;
            lowPass.connect(highPass);
            highPass.connect(audioContext.destination);

            source.start(0, 0, 30);
            audioContext.startRendering();
          } else {
            setIsFileSubmitted(false);
            setIsModalOpen(true);
            setModalMessage(
              "Audio file must be greater than 30 seconds in length."
            );
          }
        }
      );
      audioContext.oncomplete = (e: any) => {
        const buffer = e.renderedBuffer;
        const peaks = findPeaks([
          buffer.getChannelData(0),
          buffer.getChannelData(1),
        ]);

        const groups = getIntervals(peaks);
        const top = groups
          .sort(
            (
              a: { tempo: number; count: number },
              b: { tempo: number; count: number }
            ) => {
              return b.count - a.count;
            }
          )
          .splice(0, 5);

        //guess BPM and samples and store in state
        const approximateBPM = Math.round(top[0].tempo);
        const sampleCount = top[0].count;
        const otherGuesses = top.slice(1);
        setOtherBeatsPerMinuteGuesses(otherGuesses);
        setBeatsPerMinute(approximateBPM);
        setSamples(sampleCount);
      };
    }
  }, [examinedAudio.audio]);

  //fetches access token to be used for interacting with spotify's apis and to be used further in SpotifyForm component
  const fetchSpotifyAccessToken = async (): Promise<void> => {
    await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        //prettier-ignore
        "Authorization":
          "Basic " +
          Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setIsSpotifyLoaded(true);
        setToken(data.access_token);
        window.localStorage.setItem("token", data.access_token);
      })
      .catch((_error) => {
        setIsSpotifyLoaded(true);
        setIsError(true);
      });
  };

  useEffect(() => {
    const tokenInStorage = window.localStorage.getItem("token");
    if (!token || !tokenInStorage) {
      fetchSpotifyAccessToken();
    }
  }, [token]);

  //------------------------------------------- UI STUFF -------------------------------------------//
  const openFileBox = (): void => {
    setIsUIElementsOpen({
      isSpotifyBoxOpen: false,
      isFileBoxOpen: true,
      isFileSubmitted: false,
    });
    setIsFileSubmitted(false);
  };

  const openSpotifyBox = (): void => {
    setIsUIElementsOpen({
      isSpotifyBoxOpen: true,
      isFileBoxOpen: false,
      isFileSubmitted: false,
    });
    setIsFileSubmitted(false);
  };

  const openThenCloseSuccessModal = (): void => {
    setIsModalOpen(true);
    setTimeout(() => {
      setIsModalOpen(false);
    }, 3000);
  };

  const handleDragFile = (e: any): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const onFileboxButtonClick = (e: any): void => {
    e.preventDefault();
    fileBoxRef.current.click();
  };

  return (
    <React.Fragment>
      <div className="main-intro">
        <div className="main-intro-two">
          <div className="main-intro-two-five">
            <div className="main-intro-three">
              <Box alignSelf="start" onClick={() => navigate(0)}>
                <img
                  className="pulse-logo"
                  src={pulseBPMglow}
                  alt="pulseBPM"
                ></img>
              </Box>
              <Paragraph
                textAlign="justify"
                color="light-2"
                className="main-para"
              >
                Upload an audio file that contains a custom song, snippet of a
                song, or audio containing a beat to approximate the possible
                beats per minute of the audio{" "}
                <span className="wont-work-text">
                  (will not work with quiet files and audio must be greater than
                  30 seconds in duration).
                </span>{" "}
              </Paragraph>
              <Paragraph className="main-para-two" textAlign="justify">
                <span className="spotify-option-text">
                  You can also choose to search from Spotify's API in order to
                  discover the BPM of existing tracks.
                </span>{" "}
              </Paragraph>
              <div className="btn-container">
                <button
                  className="decision-btn-one"
                  onClick={() => openFileBox()}
                >
                  Upload File
                </button>

                <button
                  className="decision-btn-two"
                  onClick={() => openSpotifyBox()}
                >
                  Search via Spotify
                  <span className="spot-icon-in-btn">
                    <Spotify color="light-1" size="14px" />
                  </span>
                </button>
              </div>
            </div>
            {isUIElementsOpen.isFileBoxOpen && (
              <div className="filebox-container">
                <form id="form-upload" onDragEnter={handleDragFile}>
                  <input
                    ref={fileBoxRef}
                    type="file"
                    id="file-upload-input"
                    multiple={false}
                    onChange={onChangeAudioFile}
                    accept=".mp3,.wav"
                  />
                  <label
                    id="file-upload-label"
                    htmlFor="file-upload-input"
                    className={isDragActive ? "drag-active" : ""}
                  >
                    <div className="file-inner-div">
                      <Upload size="30px" color="pink" />
                      <p className="file-para">Drag and drop a file here or</p>
                      <button
                        className="form-upload-file-btn"
                        onClick={onFileboxButtonClick}
                      >
                        Upload a File
                      </button>
                    </div>
                  </label>
                  {isDragActive && (
                    <div
                      id="file-drag"
                      onDragEnter={handleDragFile}
                      onDragLeave={handleDragFile}
                      onDragOver={handleDragFile}
                      onDrop={handleDropFile}
                    ></div>
                  )}
                </form>
              </div>
            )}
            {isUIElementsOpen.isSpotifyBoxOpen && (
              <SpotifyForm
                trackInfo={trackInfo}
                setTrackInfo={setTrackInfo}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalMessage={modalMessage}
                setModalMessage={setModalMessage}
                isFileSubmitted={isFileSubmitted}
                token={token}
                isSpotifyLoaded={isSpotifyLoaded}
                isError={isError}
                setIsError={setIsError}
              />
            )}

            {isFileSubmitted && (
              <Box>
                <Box
                  align="start"
                  className="details-container"
                  direction="column"
                  justify="start"
                >
                  <Box align="start">
                    <Box direction="column">
                      <Text className="audio-text" size="1rem">
                        <span className="audio-text-title">File Type:</span>{" "}
                        {fileData.fileType}{" "}
                      </Text>
                      <Text
                        textAlign="start"
                        className="audio-text"
                        size="1rem"
                      >
                        <span className="audio-text-title">Track: </span>{" "}
                        {fileData.fileName.slice(0, -4)}
                      </Text>
                      <Text
                        textAlign="start"
                        className="audio-text"
                        size="1rem"
                      >
                        <span className="audio-text-title">Duration:</span>{" "}
                        {songDuration}
                      </Text>
                    </Box>
                    <Box
                      alignSelf="center"
                      direction="column"
                      margin={{ top: "medium" }}
                      gap="medium"
                    >
                      <Box
                        direction="column"
                        alignSelf="center"
                        margin={{ top: "medium" }}
                        gap="medium"
                      >
                        <Text className="audio-bg">Best Guess:</Text>
                        <Box
                          className="audio-results-container"
                          animation={{
                            size: "medium",
                            type: "pulse",
                            duration: 3000,
                          }}
                        >
                          <Text className="audio-guess-results">
                            <strong>{beatsPerMinute}</strong> BPM{" "}
                            <span className="make-white">with</span>{" "}
                            <strong>{samples}</strong>{" "}
                            <span className="make-white">samples.</span>
                          </Text>
                        </Box>
                      </Box>
                      <Box
                        direction="column"
                        gap="small"
                        margin={{ bottom: "medium", top: "small" }}
                      >
                        <Text
                          className="other-guesses-title"
                          textAlign="center"
                          color="#D3D3D3"
                        >
                          Other guesses:{" "}
                          {otherBeatsPerMinuteGuesses.map((item, index) => {
                            return (
                              <Text
                                className="other-guesses-each"
                                key={index}
                                textAlign="center"
                                color="pink"
                              >
                                <strong>{item.tempo}</strong> BPM{" "}
                              </Text>
                            );
                          })}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            {isModalOpen && (
              <FileModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalMessage={modalMessage}
                isFileSubmitted={isFileSubmitted}
              />
            )}
          </div>
        </div>
      </div>
      <div className="waveform-container">
        <div id="waveform">
          <div ref={containerRef}></div>{" "}
          <button onClick={handlePlayer} className="hide-btn" id="play-btn">
            {isAudioPlaying ? <Pause color="pink" /> : <Play color="pink" />}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
