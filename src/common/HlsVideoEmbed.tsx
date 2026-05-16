/**
 * (c) 2026, Calliope gGmbH.
 *
 * SPDX-License-Identifier: MIT
 *
 * HLS video player used for the welcome dialog (and any future
 * in-editor videos). The stream is served from public/cms/videos/.
 * Safari plays the .m3u8 natively; other browsers go through hls.js.
 *
 * Layout: the video sits above a flat control strip — no overlays on
 * top of the frame. The strip is always visible, so we don't need
 * fade-in/out machinery.
 */

import {
  AspectRatio,
  Box,
  Flex,
  IconButton,
  Text,
  useToken,
} from "@chakra-ui/react";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiPauseFill,
  RiPlayFill,
  RiVolumeMuteFill,
  RiVolumeUpFill,
} from "react-icons/ri";
import Spinner from "./Spinner";

export interface HlsVideo {
  alt?: string;
  attribution?: string;
  caption?: string;
  /** Path relative to the editor root, e.g. "/cms/videos/welcome/index.m3u8". */
  src: string;
  /** Optional poster image path. */
  poster?: string;
}

interface HlsVideoEmbedProps {
  video: HlsVideo | undefined;
}

const formatTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const r = total % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const HlsVideoEmbed = ({ video }: HlsVideoEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [brand500] = useToken("colors", ["brand.500"]);

  // Wire HLS to the <video>.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video?.src) return;
    const base = process.env.PUBLIC_URL || "";
    const src = video.src.startsWith("http") ? video.src : `${base}${video.src}`;
    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(el);
      return () => hls.destroy();
    }
    el.src = src;
  }, [video?.src]);

  // <video> -> React state.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onVol = () => setIsMuted(el.muted);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("volumechange", onVol);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("volumechange", onVol);
    };
  }, []);

  // Fullscreen state.
  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
  }, []);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      const el = videoRef.current;
      if (!el) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowRight":
          e.preventDefault();
          el.currentTime = Math.min(el.currentTime + 5, el.duration || 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          el.currentTime = Math.max(el.currentTime - 5, 0);
          break;
      }
    },
    [togglePlay, toggleMute, toggleFullscreen]
  );

  if (!video) {
    return (
      <AspectRatio ratio={16 / 9}>
        <Spinner />
      </AspectRatio>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Extracted out so TS doesn't choke on the inline union of pseudo-element keys.
  const seekBarSx: any = {
    width: "100%",
    height: "4px",
    appearance: "none",
    background: `linear-gradient(to right, ${brand500} 0%, ${brand500} ${progress}%, rgba(255,255,255,0.25) ${progress}%, rgba(255,255,255,0.25) 100%)`,
    borderRadius: "9999px",
    outline: "none",
    cursor: "pointer",
    "&::-webkit-slider-thumb": {
      appearance: "none",
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      background: "white",
      border: `2px solid ${brand500}`,
      cursor: "pointer",
      transition: "transform 120ms",
    },
    "&::-webkit-slider-thumb:hover": { transform: "scale(1.2)" },
    "&::-moz-range-thumb": {
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      background: "white",
      border: `2px solid ${brand500}`,
      cursor: "pointer",
    },
    "&:focus-visible": { boxShadow: `0 0 0 3px ${brand500}` },
  };

  return (
    <Box as="figure" m={0}>
      <Box
        ref={containerRef}
        borderRadius="lg"
        overflow="hidden"
        bg="gray.900"
        tabIndex={0}
        onKeyDown={onKey}
        sx={{
          "&:focus": { outline: "none" },
          "&:focus-visible": { boxShadow: `0 0 0 3px ${brand500}` },
        }}
      >
        <AspectRatio ratio={16 / 9} bg="black">
          <video
            ref={videoRef}
            playsInline
            preload="metadata"
            poster={video.poster}
            aria-label={video.alt}
            onClick={togglePlay}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              cursor: "pointer",
              display: "block",
            }}
          />
        </AspectRatio>

        {/* Flat control strip below the video. */}
        <Flex
          px={3}
          py={2}
          alignItems="center"
          gap={2}
          bg="gray.900"
          color="white"
        >
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            icon={isPlaying ? <RiPauseFill /> : <RiPlayFill />}
            onClick={togglePlay}
            size="sm"
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
            _active={{ bg: "whiteAlpha.400" }}
          />

          <Text
            fontSize="xs"
            minW="80px"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          <Box flex="1" mx={1}>
            <Box
              as="input"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={onSeek}
              aria-label="Seek"
              sx={seekBarSx}
            />
          </Box>

          <IconButton
            aria-label={isMuted ? "Unmute" : "Mute"}
            icon={isMuted ? <RiVolumeMuteFill /> : <RiVolumeUpFill />}
            onClick={toggleMute}
            size="sm"
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
            _active={{ bg: "whiteAlpha.400" }}
          />
          <IconButton
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            icon={isFullscreen ? <RiFullscreenExitLine /> : <RiFullscreenLine />}
            onClick={toggleFullscreen}
            size="sm"
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
            _active={{ bg: "whiteAlpha.400" }}
          />
        </Flex>
      </Box>

      {video.caption && (
        <Text as="figcaption" mt="5px" fontSize="sm">
          {video.caption}
        </Text>
      )}
      {video.attribution && (
        <Text as="figcaption" mt="5px" fontSize="sm">
          {video.attribution}
        </Text>
      )}
    </Box>
  );
};

export default HlsVideoEmbed;
