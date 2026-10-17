import {
  parseCaptionsUrl,
  parseInstitutionalVideoUrl,
  parsePosterUrl,
  youtubeEmbedUrl,
} from './institutional-video.util';

describe('parseInstitutionalVideoUrl', () => {
  it.each([
    'https://cdn.example.com/avila/institucional.mp4',
    'https://cdn.example.com/avila/institucional.mp4?token=abc',
  ])('accepts MP4 %s', (value) => {
    expect(parseInstitutionalVideoUrl(value)).toMatchObject({ kind: 'file' });
  });

  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'wide'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'wide'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'wide'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'wide'],
    ['https://m.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'short'],
    ['https://youtube.com/shorts/PepqDgdLHzA', 'PepqDgdLHzA', 'short'],
  ])('accepts YouTube %s', (value, videoId, layout) => {
    expect(parseInstitutionalVideoUrl(value)).toEqual({ kind: 'youtube', videoId, layout });
  });

  it.each([
    'http://cdn.example.com/video.mp4',
    'https://evil.example/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/channel/UC1234567890',
    'https://www.youtube.com/playlist?list=PL123',
    'https://player.vimeo.com/video/123',
    'javascript:alert(1)',
    'https://user:pass@cdn.example.com/video.mp4',
    'https://cdn.example.com/video.mp4.html',
    '',
  ])('rejects %s', (value) => {
    expect(parseInstitutionalVideoUrl(value)).toBeNull();
  });
});

describe('poster and captions', () => {
  it('accepts image and webvtt urls', () => {
    expect(parsePosterUrl('https://cdn.example.com/capa.png')).toContain('capa.png');
    expect(parseCaptionsUrl('https://cdn.example.com/legenda.vtt')).toContain('legenda.vtt');
  });

  it('rejects non-image posters and non-vtt captions', () => {
    expect(parsePosterUrl('https://cdn.example.com/capa.html')).toBeNull();
    expect(parseCaptionsUrl('https://cdn.example.com/legenda.srt')).toBeNull();
  });
});

describe('youtubeEmbedUrl', () => {
  it('uses the nocookie embed host and stays muted', () => {
    const url = new URL(youtubeEmbedUrl('dQw4w9WgXcQ', true));
    expect(url.origin).toBe('https://www.youtube-nocookie.com');
    expect(url.pathname).toBe('/embed/dQw4w9WgXcQ');
    expect(url.searchParams.get('mute')).toBe('1');
    expect(url.searchParams.get('autoplay')).toBe('1');
    expect(url.searchParams.get('playsinline')).toBe('1');
  });

  it('keeps the official Ávila short on the nocookie embed path', () => {
    const parsed = parseInstitutionalVideoUrl('https://youtube.com/shorts/PepqDgdLHzA');
    expect(parsed).toEqual({ kind: 'youtube', videoId: 'PepqDgdLHzA', layout: 'short' });
    if (parsed?.kind !== 'youtube') return;
    const url = new URL(youtubeEmbedUrl(parsed.videoId, true));
    expect(url.href).toBe(
      'https://www.youtube-nocookie.com/embed/PepqDgdLHzA?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&mute=1&autoplay=1',
    );
  });
});
