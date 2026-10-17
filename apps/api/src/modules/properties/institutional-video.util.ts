const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

export type InstitutionalVideoSource =
  | { kind: 'file'; src: string }
  | { kind: 'youtube'; videoId: string; layout: 'short' | 'wide' };

function httpsUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (/[\s]/.test(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0') {
    return null;
  }
  return url;
}

function youtubeFrom(url: URL): { videoId: string; layout: 'short' | 'wide' } | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const idOf = (value: string) => (YOUTUBE_ID.test(value) ? value : null);
  if (host === 'youtu.be') {
    const videoId = idOf(url.pathname.split('/').filter(Boolean)[0] ?? '');
    return videoId ? { videoId, layout: 'wide' } : null;
  }
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null;
  }
  const parts = url.pathname.split('/').filter(Boolean);
  const head = (parts[0] ?? '').toLowerCase();
  if (head === 'watch') {
    const videoId = idOf(url.searchParams.get('v') ?? '');
    return videoId ? { videoId, layout: 'wide' } : null;
  }
  if (head === 'shorts' || head === 'embed' || head === 'live' || head === 'v') {
    const videoId = idOf(parts[1] ?? '');
    return videoId ? { videoId, layout: head === 'shorts' ? 'short' : 'wide' } : null;
  }
  return null;
}

/** Aceita somente MP4 em HTTPS ou um vídeo do YouTube. Não aceita iframe arbitrário. */
export function parseInstitutionalVideoUrl(value: string): InstitutionalVideoSource | null {
  const url = httpsUrl(value);
  if (!url) return null;
  const youtube = youtubeFrom(url);
  if (youtube) return { kind: 'youtube', ...youtube };
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    return null;
  }
  if (url.pathname.toLowerCase().endsWith('.mp4')) {
    return { kind: 'file', src: url.toString() };
  }
  return null;
}

export function parsePosterUrl(value: string): string | null {
  const url = httpsUrl(value);
  if (!url) return null;
  return IMAGE_EXT.test(url.pathname) ? url.toString() : null;
}

export function parseCaptionsUrl(value: string): string | null {
  const url = httpsUrl(value);
  if (!url) return null;
  return url.pathname.toLowerCase().endsWith('.vtt') ? url.toString() : null;
}

export function youtubeEmbedUrl(videoId: string, autoplay: boolean) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    mute: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
