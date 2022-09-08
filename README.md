pulseBPM - Beats Per Minute Detector/Finder for Audio
by LJ White

INTRO:
Although I now have a good bit of experience under my belt, I realized that I didnt't have any public GitHub repos, which is not great...so this project was started due to the sheer fact that I can have some code that is public with hopefully a lot more to come. I do have a background in producing electronic music with Ableton Live (https://soundcloud.com/ljwhite), so learning how to do similar processes in code instead of in a DAW was cool.

WHAT is PULSEBPM?:
pulseBPM is a beats per minute detector for music made with TypeScript React.
Users can upload any custom audio file greater than 30 seconds in duration and that contains music or a beat, and pulseBPM will guess the beats per minute of the audio and display it to the user.
If users are just curious about the BPM of an exisiting track, they can simply choose to search Spotify's database for a song, and pulseBPM will display the BPM of the track.

Whenever a custom audio file is uploaded, or a Spotify track is selected, pulseBPM will display the waveform and allow playback for the user utilizing the WaveSurfer.js library. If a Spotify track is selected, the displayed audio will only be a preview of the song from Spotify that is 30 seconds in duration. If a custom file is uploaded, pulseBPM will display the entirety of the waveform and allow playback of the entire file.

I tried to leave some comments throughout the code explaining what does what. To my knowledge this is the first project of this kind using both TypeScript and React - especially one that can handle an uploaded audio file from user and that works pretty well as long as there is music in the audio file.

Most of the meat and potatoes is in src/Components/BPMDetectMain
and src/Components/SpotifyForm

What I would do differently if starting fresh:

1.) Only using CSS for styling - When beginning this project I wasn't particularly worried about the look and feel as I typically am. I chose to work with Grommet, a component library for React that I do love. Grommet is nice to work with and it's what I primarily used for the entire Spotify search functionality. As I went along, however, I couldn't help but want to make some aspects look nicer, so I ended up using more and more CSS to add more customizability - not that you can't with Grommet, just more you can do with CSS prob. With that said, there is a mixture of Grommet and CSS in the project, which I typically wouldn't do. If I started over fresh, as much as I like Grommet, I would handle everything with pure CSS/HTML next time. The app still seems okay anyhow, but I may not mix component UIs with CSS. I would pick one or the other and stick to it.

2.) These are things that I will continually work on adding anyway - however - needs better handling if detected volume in uploaded file is too low or completely silent. Better handling if file size is excessive.

3.) Probably could have/should have used a reducer, LOL. Also a little bit of prop drilling going on, but it's not out of hand I don't think - some prop drilling is fine I would argue.

4.) make the JSX code cleaner, lol's. And maybe break more stuff into diff components for cleanliness.

5.) Just use NextJS and not CRA

Will update soon:
-ScriptProcessorNode to AudioWorkletNode since ScripProcessor still works in browsers but is deprecated
-Add ways to check if volume of uploaded audio file isnt sufficient to find BPM
-Add caching with React Query
