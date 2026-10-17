"use client";

import { useEffect, useRef, useState } from "react";

import {
  youtubeEmbedUrl,
  type InstitutionalVideoSource,
} from "@/lib/institutional-video";

const PLAY_AT = 0.6;
const PAUSE_AT = 0.15;
const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

type CaptionsState = "missing" | "ready" | "error" | "youtube";

function postYouTube(frame: HTMLIFrameElement | null, func: "playVideo" | "pauseVideo" | "mute" | "unMute") {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), YOUTUBE_ORIGIN);
}

export function InstitutionalVideo({
  source,
  title,
  description,
  poster,
  captions,
}: {
  source: InstitutionalVideoSource;
  title: string | null;
  description: string | null;
  poster: string | null;
  captions: string | null;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const engagedRef = useRef(false);
  const userPausedRef = useRef(false);
  const reducedRef = useRef(false);
  const soundRef = useRef(false);
  const frameReadyRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [captionsState, setCaptionsState] = useState<CaptionsState>(
    source.kind === "youtube" ? "youtube" : captions ? "ready" : "missing",
  );
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const sourceKey = source.kind === "file" ? source.src : source.videoId;

  useEffect(() => {
    const node = rootRef.current;
    const video = videoRef.current;
    if (!node) return;
    engagedRef.current = false;
    frameReadyRef.current = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      reducedRef.current = motion.matches;
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);
    const trackEl = video?.querySelector("track");
    const onTrackError = () => setCaptionsState("error");
    trackEl?.addEventListener("error", onTrackError);

    const showFileCaptions = () => {
      const track = videoRef.current?.textTracks?.[0];
      if (track) track.mode = "showing";
    };

    const pause = () => {
      if (source.kind === "file") videoRef.current?.pause();
      else postYouTube(frameRef.current, "pauseVideo");
      setPlaying(false);
    };

    const play = () => {
      if (userPausedRef.current || reducedRef.current) return;
      if (source.kind === "file") {
        const video = videoRef.current;
        if (!video) return;
        if (!video.getAttribute("src")) {
          video.preload = "auto";
          video.src = source.src;
        }
        video.muted = !soundRef.current;
        video.playsInline = true;
        showFileCaptions();
        void video.play().then(() => {
          setStarted(true);
          setPlaying(true);
        }).catch(() => setPlaying(false));
        return;
      }
      if (!frameReadyRef.current) {
        frameReadyRef.current = true;
        setFrameSrc(youtubeEmbedUrl(source.videoId, true));
        setStarted(true);
        setPlaying(true);
        return;
      }
      postYouTube(frameRef.current, soundRef.current ? "unMute" : "mute");
      postYouTube(frameRef.current, "playVideo");
      setPlaying(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0]?.intersectionRatio ?? 0;
        if (!engagedRef.current && ratio >= PLAY_AT) {
          engagedRef.current = true;
          play();
        } else if (engagedRef.current && ratio <= PAUSE_AT) {
          engagedRef.current = false;
          pause();
        }
      },
      { threshold: [0, PAUSE_AT, PLAY_AT, 1] },
    );
    observer.observe(node);

    const onVisibility = () => {
      if (document.hidden) {
        pause();
        return;
      }
      if (engagedRef.current && !userPausedRef.current && !reducedRef.current) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      trackEl?.removeEventListener("error", onTrackError);
      if (source.kind === "file") video?.pause();
    };
  }, [source, sourceKey]);

  function playFromUser() {
    userPausedRef.current = false;
    reducedRef.current = false;
    if (source.kind === "file") {
      const video = videoRef.current;
      if (!video) return;
      if (!video.getAttribute("src")) {
        video.preload = "auto";
        video.src = source.src;
      }
      video.muted = !soundRef.current;
      const track = video.textTracks?.[0];
      if (track) track.mode = "showing";
      void video
        .play()
        .then(() => {
          setStarted(true);
          setPlaying(true);
        })
        .catch(() => setPlaying(false));
      return;
    }
    if (!frameReadyRef.current) {
      frameReadyRef.current = true;
      setFrameSrc(youtubeEmbedUrl(source.videoId, true));
    } else postYouTube(frameRef.current, "playVideo");
    setStarted(true);
    setPlaying(true);
  }

  function pauseFromUser() {
    userPausedRef.current = true;
    if (source.kind === "file") videoRef.current?.pause();
    else postYouTube(frameRef.current, "pauseVideo");
    setPlaying(false);
  }

  function toggleSound() {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    if (source.kind === "file") {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !next;
      if (next) {
        userPausedRef.current = false;
        void video.play().then(() => setPlaying(true)).catch(() => {
          video.muted = true;
          soundRef.current = false;
          setSoundOn(false);
        });
      }
      return;
    }
    if (!frameReadyRef.current) {
      frameReadyRef.current = true;
      setFrameSrc(youtubeEmbedUrl(source.videoId, true));
      setStarted(true);
      setPlaying(true);
    }
    postYouTube(frameRef.current, next ? "unMute" : "mute");
    if (next) {
      userPausedRef.current = false;
      postYouTube(frameRef.current, "playVideo");
      setPlaying(true);
    }
  }

  const captionsNote =
    source.kind === "youtube"
      ? captions
        ? "O arquivo WebVTT informado não entra no YouTube. As legendas desse formato valem para MP4; no YouTube aparecem só as legendas publicadas no próprio vídeo."
        : "Legendas WebVTT ainda não foram fornecidas. No YouTube, só aparecem as legendas publicadas no próprio vídeo."
      : captionsState === "error"
        ? "Não foi possível carregar as legendas. O arquivo WebVTT precisa estar público em HTTPS."
        : captions
          ? null
          : "Legendas ainda não foram fornecidas. Publique um arquivo WebVTT para sincronizar o texto com a fala.";

  return (
    <figure ref={rootRef} className="mx-auto w-full max-w-3xl" aria-label={title || "Vídeo institucional"}>
      {title ? <h3 className="text-xl font-bold tracking-tight text-[#000C24] md:text-2xl">{title}</h3> : null}
      {description ? (
        <p className={`${title ? "mt-2" : ""} text-sm leading-relaxed text-[#10294B] md:text-base`}>{description}</p>
      ) : null}
      <div className={`${title || description ? "mt-4" : ""} relative aspect-video overflow-hidden rounded-[28px] bg-[#000C24] shadow-[0_24px_50px_-28px_rgba(0,12,36,.65)]`}>
        {source.kind === "file" ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={poster ?? undefined}
            playsInline
            muted
            preload="none"
            onPlay={() => {
              setPlaying(true);
              setStarted(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              userPausedRef.current = true;
              setPlaying(false);
            }}
          >
            {captions ? (
              <track kind="captions" srcLang="pt-BR" label="Português" src={captions} default />
            ) : null}
          </video>
        ) : frameSrc ? (
          <iframe
            ref={frameRef}
            title={title || "Vídeo institucional"}
            src={frameSrc}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            onLoad={() => {
              postYouTube(frameRef.current, soundRef.current ? "unMute" : "mute");
              postYouTube(frameRef.current, userPausedRef.current ? "pauseVideo" : "playVideo");
            }}
          />
        ) : null}
        {poster && !started ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${poster.replace(/["\\\n\r]/g, "")}")` }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#000C24]/80 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#000C24]"
            onClick={playing ? pauseFromUser : playFromUser}
          >
            {playing ? "Pausar" : "Reproduzir"}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full bg-[#DEAE5D] px-4 text-sm font-semibold text-[#000C24]"
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? "Silenciar" : "Assistir com som"}
          </button>
        </div>
      </div>
      {captionsNote ? (
        <figcaption className="mt-3 text-sm leading-relaxed text-[#10294B]">{captionsNote}</figcaption>
      ) : (
        <figcaption className="sr-only">Legendas em português sincronizadas com o vídeo.</figcaption>
      )}
    </figure>
  );
}
