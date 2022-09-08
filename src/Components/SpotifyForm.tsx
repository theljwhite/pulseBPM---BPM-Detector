import React from "react";
import { useState, useRef } from "react";
import { Box, Form, FormField, Text, TextInput } from "grommet";
import LoadingModal from "./LoadingModal";
import FileModal from "./FileModal";
import { Search } from "grommet-icons";

interface SpotProps {
  trackInfo: {
    trackId: string;
    trackName: string;
    artist: string;
    preview: string;
    albumArt: string;
  };
  setTrackInfo: React.Dispatch<
    React.SetStateAction<{
      trackId: string;
      trackName: string;
      artist: string;
      preview: string;
      albumArt: string;
    }>
  >;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalMessage: string;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>;
  isFileSubmitted: boolean;
  token: string;
  isSpotifyLoaded: boolean;
  isError: boolean;
  setIsError: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SpotifyForm({
  trackInfo,
  setTrackInfo,
  isModalOpen,
  setIsModalOpen,
  modalMessage,
  setModalMessage,
  isFileSubmitted,
  token,
  isSpotifyLoaded,
  isError,
  setIsError,
}: SpotProps) {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [spotifyTempo, setSpotifyTempo] = useState<number>(0);
  const [spotifyDuration, setSpotifyDuration] = useState<string | number>("");
  const [isSearchSubmitted, setIsSearchSubmitted] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<
    {
      label: string;
      value: string;
      id: string;
      artist: string;
      trackName: string;
      preview?: string;
      artwork: string;
    }[]
  >([
    {
      label: "",
      value: "",
      id: "",
      artist: "",
      trackName: "",
      preview: "",
      artwork: "",
    },
  ]);
  const throttler = useRef<any>(false);
  const inputRef = useRef<any>();

  //fetches audio features for a specific track

  const getAudioFeaturesForTrack = async (trackID: string): Promise<void> => {
    setIsLoaded(false);
    if (token) {
      await fetch(`https://api.spotify.com/v1/audio-analysis/${trackID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const duration = data.track.duration;
          const minutes = Math.floor((duration % 3600) / 60);
          const seconds = Math.floor((duration % 3600) % 60);
          const timeFormat =
            ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);

          setSpotifyDuration(timeFormat);
          setSpotifyTempo(data.track.tempo);
          setIsLoaded(true);
        })
        .catch((_error) => {
          setIsLoaded(true);
          setIsError(true);
        });
    }
  };

  //searches spotify for song data and prepares suggestions for users
  //input length > 3 is to limit the amount of requests sent to api, as well as the throttler,
  // although I will add caching via React Query when not lazy

  const searchSpotifyTracks = (): void => {
    if (throttler.current) {
      return;
    }
    if (inputRef.current.value.length > 3) {
      let query: string;
      if (inputRef.current.value !== "") {
        query = inputRef.current.value;
      }
      throttler.current = true;
      setTimeout(async () => {
        throttler.current = false;
        await fetch(
          `https://api.spotify.com/v1/search?query=${query}&type=track&market=us&limit=5&offset=0`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((response) => response.json())
          .then((data) => {
            setIsLoaded(true);
            const otherSuggestions = data.tracks.items.map(
              (item: any, index: number) => {
                const suggestionList = {
                  value: index,
                  label:
                    item.artists[0].name +
                    " ".repeat(2) +
                    "-" +
                    " ".repeat(2) +
                    item.name,
                  id: item.id,
                  trackName: item.name,
                  artist: item.artists[0].name,
                  preview: item.preview_url,
                  artwork: item.album.images[0].url,
                };
                return suggestionList;
              }
            );
            setSuggestions(otherSuggestions);
          })
          .catch((_error) => {
            setIsLoaded(true);
            setIsError(true);
          });
      }, 400);
    }
  };

  const handleSelectedSuggestion = (e: any): void => {
    setIsSearchSubmitted(true);
    getAudioFeaturesForTrack(e.suggestion.id);
    setTrackInfo({
      trackId: e.suggestion.id,
      trackName: e.suggestion.trackName,
      artist: e.suggestion.artist,
      preview: e.suggestion.preview,
      albumArt: e.suggestion.artwork,
    });
    inputRef.current.value = "";
  };

  if (isError) {
    setIsModalOpen(true);
    setModalMessage("Crap! Something went wrong. Try again later.");
    return (
      <FileModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalMessage={modalMessage}
        isFileSubmitted={isFileSubmitted}
      />
    );
  } else if (!isLoaded && !isSpotifyLoaded) {
    return <LoadingModal />;
  }

  return (
    <React.Fragment>
      <Box width="medium" className="spotify-container">
        <Form
          messages={{
            invalid: "invalid",
            required: "Field cannot be empty",
          }}
        >
          <FormField
            htmlFor="search-text"
            name="search"
            label="Search for a track"
            contentProps={{
              border: { color: "light-1", size: "small" },
            }}
          >
            <TextInput
              icon={<Search color="pink" />}
              id="search-text"
              placeholder="e.g. Tiesto - Wasted"
              onChange={searchSpotifyTracks}
              suggestions={suggestions}
              onSuggestionSelect={handleSelectedSuggestion}
              ref={inputRef}
              dropHeight="small"
            />
          </FormField>

          <Box
            direction="row"
            justify="between"
            margin={{ top: "small", bottom: "medium" }}
          ></Box>
        </Form>

        {isSearchSubmitted && isLoaded && (
          <Box align="start" className="spotify-info-container">
            <Box align="start">
              <img
                src={trackInfo.albumArt}
                alt="album cover from search result"
                className="album-art-img"
              ></img>
              <Text className="audio-text">
                <span className="audio-text-title">Artist:</span>{" "}
                {trackInfo.artist}
              </Text>
              <Text textAlign="start" className="audio-text">
                <span className="audio-text-title">Track:</span>{" "}
                {trackInfo.trackName}
              </Text>
              <Text textAlign="start" className="audio-text">
                <span className="audio-text-title">Duration:</span>{" "}
                {spotifyDuration}
              </Text>
            </Box>

            <Box direction="column" gap="small" margin={{ top: "2rem" }}>
              <Text
                textAlign="center"
                size="1.5rem"
                className="spotify-bpm-text"
              >
                BPM according to Spotify is:
              </Text>
              <Box
                animation={{
                  size: "medium",
                  type: "pulse",
                  duration: 3000,
                }}
              >
                <Text textAlign="center" size="2rem" color="pink">
                  <strong>{Math.round(spotifyTempo)}</strong> BPM{" "}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </React.Fragment>
  );
}
