/**
 * (c) 2026, Calliope gGmbH.
 *
 * SPDX-License-Identifier: MIT
 *
 * HLS video player used for the welcome dialog (and any future
 * in-editor videos). The stream is served from public/cms/videos/.
 * Safari plays the .m3u8 natively; other browsers go through hls.js.
 *
 * Controls are custom (the native <video controls> chrome is browser-
 * specific and doesn't match the rest of the editor).
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

const HIDE_CONTROLS_AFTER_MS = 2500;

const HlsVideoEmbed = ({ video }: HlsVideoEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [started, setStarted] = useState(false);

  const [brand500, brand600] = useToken("colors", ["brand.500", "brand.600"]);

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
    const onPlay = () => {
      setIsPlaying(true);
      setStarted(true);
    };
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

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = window.setTimeout(
        () => setControlsVisible(false),
        HIDE_CONTROLS_AFTER_MS
      );
    }
  }, [isPlaying]);

  // Keep controls visible whenever the video is paused.
  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    } else {
      showControls();
    }
  }, [isPlaying, showControls]);

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
    background: `linear-gradient(to right, ${brand500} 0%, ${brand500} ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`,
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
      <AspectRatio ratio={16 / 9} borderRadius="lg" overflow="hidden" bg="black">
        {/*
         * AspectRatio applies `position: absolute` to its direct child via a
         * CSS selector, so we don't fight that here. The inner Box gives us a
         * real positioning context for the overlay + controls.
         */}
        <Box>
          <Box
            ref={containerRef}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            role="group"
            tabIndex={0}
            onKeyDown={onKey}
            onMouseMove={showControls}
            onMouseLeave={() => isPlaying && setControlsVisible(false)}
            onFocus={showControls}
            sx={{
              "&:focus": { outline: "none" },
              "&:focus-visible": { boxShadow: `inset 0 0 0 3px ${brand500}` },
            }}
          >
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

            {/* Big centred play overlay — only before playback starts. */}
            {!started && (
              <Flex
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                alignItems="center"
                justifyContent="center"
                bg="blackAlpha.500"
                cursor="pointer"
                onClick={togglePlay}
                transition="background-color 150ms"
                _hover={{ bg: "blackAlpha.600" }}
              >
                <Flex
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg={brand500}
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 6px 24px rgba(0,0,0,0.4)"
                  transition="transform 120ms, background-color 120ms"
                  _hover={{ transform: "scale(1.05)", bg: brand600 }}
                >
                  {/*
                   * RiPlayFill's triangle has its vertex on the right; its
                   * centroid sits at ~48% of the viewBox width, so the SVG
                   * already centres optically with no manual offset.
                   */}
                  <Box as={RiPlayFill} fontSize="40px" />
                </Flex>
              </Flex>
            )}

            {/* Bottom control bar. */}
            <Flex
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              px={3}
              pt={10}
              pb={2}
              alignItems="center"
              gap={2}
              bgGradient="linear(to-t, blackAlpha.900 10%, blackAlpha.600 60%, blackAlpha.0)"
              color="white"
              opacity={controlsVisible ? 1 : 0}
              transition="opacity 200ms"
              pointerEvents={controlsVisible ? "auto" : "none"}
              sx={{
                // Drop-shadow on every icon + text so the bar stays legible
                // against bright video frames (no backdrop-filter — Safari
                // and older browsers don't always do that without jank).
                "& svg": {
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
                },
                "& p, & input": {
                  textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                },
              }}
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

            <Box flex="1" position="relative" mx={1}>
              {/* Track + filled portion painted by the input itself via CSS. */}
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
        </Box>
      </AspectRatio>

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
