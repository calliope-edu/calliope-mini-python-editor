/**
 * (c) 2026, Calliope gGmbH.
 *
 * SPDX-License-Identifier: MIT
 *
 * HLS video player used for the welcome dialog (and any future
 * in-editor videos). The stream is served from public/cms/videos/.
 * Safari plays the .m3u8 natively; other browsers go through hls.js.
 */

import { AspectRatio, Box, Text } from "@chakra-ui/react";
import Hls from "hls.js";
import { useEffect, useRef } from "react";
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

const HlsVideoEmbed = ({ video }: HlsVideoEmbedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video?.src) return;

    const base = process.env.PUBLIC_URL || "";
    const src = video.src.startsWith("http") ? video.src : `${base}${video.src}`;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS: native HLS.
      el.src = src;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(el);
      return () => hls.destroy();
    }
    // Last-ditch: hand the URL to the browser and hope.
    el.src = src;
  }, [video?.src]);

  if (!video) {
    return (
      <AspectRatio ratio={16 / 9}>
        <Spinner />
      </AspectRatio>
    );
  }

  return (
    <Box as="figure">
      <AspectRatio ratio={16 / 9}>
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={video.poster}
          aria-label={video.alt}
        />
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
