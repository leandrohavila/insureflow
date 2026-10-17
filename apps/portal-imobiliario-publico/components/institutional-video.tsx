"use client";

import Link from "next/link";
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

function embedSrc(videoId: string) {
  const url = new URL(youtubeEmbedUrl(videoId, true));
  url.searchParams.set("origin", window.location.origin);
  return url.toString();
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
  const [embedError, setEmbedError] = useState<number | null>(null);
  const sourceKey = source.kind === "file" ? source.src : source.videoId;

  useEffect(() => {
    const node = rootRef.current;
    const video = videoRef.current;
    if (!node) return;
    engagedRef.current = false;
    frameReadyRef.current = false;
    setEmbedError(null);
    const onYouTubeMessage = (event: MessageEvent) => {
      if (source.kind !== "youtube" || event.origin !== YOUTUBE_ORIGIN) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const data = payload as { event?: string; info?: unknown };
      if (data.event === "onError") {
        const code = typeof data.info === "number" ? data.info : Number(data.info);
        setEmbedError(Number.isFinite(code) ? code : 0);
        setPlaying(false);
        return;
      }
      const info = data.info;
      const state =
        typeof info === "number"
          ? info
          : info && typeof info === "object" && "playerState" in info
            ? Number((info as { playerState?: unknown }).playerState)
            : null;
      if (state === 1) setPlaying(true);
      if (state === 0 || state === 2) setPlaying(false);
    };
    window.addEventListener("message", onYouTubeMessage);
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
        setFrameSrc(embedSrc(source.videoId));
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
      window.removeEventListener("message", onYouTubeMessage);
      trackEl?.removeEventListener("error", onTrackError);
      if (source.kind === "file") video?.pause();
    };
  }, [source, sourceKey]);

  function playFromUser() {
    if (embedError === 101 || embedError === 150) return;
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
      setFrameSrc(embedSrc(source.videoId));
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
    if (embedError === 101 || embedError === 150) return;
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
      setFrameSrc(embedSrc(source.videoId));
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

  const vertical = source.kind === "youtube" && source.layout === "short";
  const hasCopy = Boolean(title || description);
  const embedRefused = embedError === 101 || embedError === 150;
  const captionVisible = embedRefused || (source.kind === "file" && captionsState === "error");
  const captionText = embedRefused
    ? "O YouTube não permitiu exibir este vídeo aqui."
    : source.kind === "youtube"
      ? "Se o YouTube tiver legendas para este vídeo, elas aparecem no player."
      : captionsState === "error"
        ? "As legendas deste vídeo não puderam ser exibidas."
        : captions
          ? "Legendas em português sincronizadas com o vídeo."
          : "Este vídeo não informa legendas.";
  const captionClass = vertical
    ? "order-3 mt-3 text-xs leading-relaxed text-[#5c6b82] lg:order-none lg:mt-4"
    : "mt-3 text-xs leading-relaxed text-[#5c6b82]";
  const caption = (
    <figcaption className={captionVisible ? captionClass : "sr-only"}>{captionText}</figcaption>
  );
  const opportunity = (
    <Link
      href="/imoveis"
      className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#C09048] px-6 text-base font-semibold text-[#000C24] transition-colors hover:bg-[#DEAE5D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000C24] lg:mt-6 lg:w-auto lg:px-7"
    >
      Encontre sua próxima oportunidade
    </Link>
  );

  const frame = (
    <div
      className={`relative w-full overflow-hidden rounded-[28px] bg-[#000C24] shadow-[0_24px_50px_-28px_rgba(0,12,36,.65)] ${
        vertical
          ? "order-2 mt-4 aspect-[9/16] max-w-[min(100%,22rem)] lg:order-none lg:mt-0 lg:w-[22rem] lg:max-w-none lg:justify-self-end"
          : `${hasCopy ? "mt-4" : ""} aspect-video`
      }`}
    >
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
              frameRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: "listening", id: "widget", channel: "widget" }),
                YOUTUBE_ORIGIN,
              );
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
  );

  return (
    <figure
      ref={rootRef}
      className={
        vertical
          ? "mx-auto flex w-full max-w-[min(100%,22rem)] flex-col lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-12"
          : "mx-auto w-full max-w-3xl"
      }
      aria-label={title || "Vídeo institucional"}
    >
      {vertical ? (
        <div className="contents lg:flex lg:flex-col lg:justify-start">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-xl font-bold leading-tight tracking-tight text-[#000C24] md:text-2xl lg:text-4xl lg:font-extrabold lg:leading-[1.08]">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className={`${title ? "mt-2 lg:mt-4" : ""} text-sm leading-relaxed text-[#10294B] md:text-base lg:text-lg`}>
                {description}
              </p>
            ) : null}
            {opportunity}
          </div>
          {caption}
        </div>
      ) : (
        <>
          {title ? <h3 className="text-xl font-bold tracking-tight text-[#000C24] md:text-2xl">{title}</h3> : null}
          {description ? (
            <p className={`${title ? "mt-2" : ""} text-sm leading-relaxed text-[#10294B] md:text-base`}>{description}</p>
          ) : null}
          {opportunity}
        </>
      )}
      {frame}
      {vertical ? null : caption}
    </figure>
  );
}
