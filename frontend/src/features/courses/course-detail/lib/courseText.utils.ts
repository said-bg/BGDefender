import type { Author, Chapter, PedagogicalContent, Course, SubChapter } from '@/services/course';
import type { ActiveLanguage } from '../courseDetail.types';

export const getPreviewText = (text: string, length = 96) => {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

export const stripHtmlToText = (value: string) =>
  decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  );

const looksLikeRichHtml = (value: string) =>
  /<(p|div|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code|table|thead|tbody|tr|td|th|hr|a|strong|em|u|s|span|img|iframe|video)(\s|>)/i.test(
    value,
  );

const isDirectVideoFile = (src: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(src);

const normalizeVideoAlign = (value: string | null | undefined) => {
  if (value === 'left' || value === 'flex-start') {
    return 'flex-start';
  }

  if (value === 'right' || value === 'flex-end') {
    return 'flex-end';
  }

  return 'center';
};

const normalizeEmbeddedVideoSrc = (src: string) => {
  try {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace(/^\/+/, '').split('/')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }

      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }
    }

    const vimeoMatch = src.match(/^https:\/\/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    if (vimeoMatch) {
      const [, videoId, hash] = vimeoMatch;
      return hash
        ? `https://player.vimeo.com/video/${videoId}?h=${hash}`
        : `https://player.vimeo.com/video/${videoId}`;
    }

    if (/^https?:\/\/www\.bilibili\.com\/video\/.*/i.test(src)) {
      return src
        .replace(/\?.*$/, '')
        .replace(
          'https://www.bilibili.com/video/',
          'https://player.bilibili.com/player.html?bvid=',
        );
    }

    if (src.includes('drive.google.com')) {
      return src.replace('/view', '/preview');
    }

    return src;
  } catch {
    return src;
  }
};

const normalizeRichTextHtmlFallback = (value: string) => {
  let normalized = value.replace(
    /<iframe\b[^>]*\bsrc=(['"])(.*?)\1[^>]*><\/iframe>/gi,
    (match, _quote, src: string) => {
      if (!isDirectVideoFile(src)) {
        const nextSrc = normalizeEmbeddedVideoSrc(src);
        if (nextSrc === src) {
          return match;
        }

        return match.replace(/\bsrc=(['"]).*?\1/i, `src="${nextSrc}"`);
      }

      return `<video src="${src}" controls playsinline preload="metadata"></video>`;
    },
  );

  // Handle wrapped video divs more robustly
  normalized = normalized.replace(
    /(<div\b[^>]*data-video[^>]*?)(?:\s+data-video-src=(['"])(.*?)\2)?([^>]*>[\s\S]*?)(<\/?(?:iframe|video)\b)/gi,
    (match, divStart, _q, rawSrc: string, restDiv, mediaStart) => {
      // If src is captured from data-video-src attribute
      if (rawSrc && rawSrc.trim()) {
        const src = rawSrc.trim();
        
        if (isDirectVideoFile(src)) {
          return `${divStart}${restDiv}${mediaStart.replace('iframe', 'video')}`;
        }
        
        const normalized = normalizeEmbeddedVideoSrc(src);
        return match.replace(/\bsrc=(['"]).*?\1/i, `src="${normalized}"`);
      }
      
      return match;
    },
  );

  return normalized;
};

export const normalizeRichTextHtml = (value: string) => {
  const normalizedFromString = normalizeRichTextHtmlFallback(value);

  if (
    typeof DOMParser === 'undefined' ||
    (!normalizedFromString.includes('<iframe') &&
      !normalizedFromString.includes('<video') &&
      !normalizedFromString.includes('data-video'))
  ) {
    return normalizedFromString;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<body>${normalizedFromString}</body>`, 'text/html');
  const body = document.body;

  body.querySelectorAll<HTMLElement>('div[data-video]').forEach((wrapper) => {
    wrapper.setAttribute('style', 'margin: 1rem 0; clear: both; display: block; width: 100%; overflow: hidden; border-radius: 18px;');

    const iframe = wrapper.querySelector<HTMLIFrameElement>('iframe');
    const video = wrapper.querySelector<HTMLVideoElement>('video');
    const rawSrc =
      wrapper.getAttribute('data-video-src') ||
      iframe?.getAttribute('src') ||
      video?.getAttribute('src') ||
      '';

    if (!rawSrc) {
      return;
    }

    if (isDirectVideoFile(rawSrc)) {
      const videoElement = video ?? document.createElement('video');
      videoElement.setAttribute('src', rawSrc);
      videoElement.setAttribute('controls', 'true');
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('preload', 'metadata');

      if (iframe) {
        iframe.replaceWith(videoElement);
      }

      wrapper.setAttribute('data-video-src', rawSrc);
      wrapper.setAttribute('data-video-kind', 'file');
      return;
    }

    const normalizedSrc = normalizeEmbeddedVideoSrc(rawSrc);
    const iframeElement = iframe ?? document.createElement('iframe');

    iframeElement.setAttribute('src', normalizedSrc);
    iframeElement.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
    iframeElement.setAttribute('allowfullscreen', 'true');
    iframeElement.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframeElement.setAttribute('width', '100%');
    iframeElement.setAttribute('height', '100%');
    iframeElement.setAttribute(
      'style',
      'position: absolute; inset: 0; width: 100%; height: 100%; border: 0;',
    );

    if (video) {
      video.replaceWith(iframeElement);
    }

    wrapper.setAttribute('data-video-src', normalizedSrc);
    wrapper.setAttribute('data-video-kind', 'embed');
  });

  body.querySelectorAll<HTMLElement>('div[data-video]').forEach((wrapper) => {
    const width = wrapper.getAttribute('data-video-width') || '100%';
    const align = normalizeVideoAlign(wrapper.getAttribute('data-video-align'));
    const firstChild = wrapper.children[0];
    if (firstChild && firstChild instanceof HTMLElement) {
      firstChild.setAttribute(
        'style',
        `display: flex; justify-content: ${align}; width: 100%;`,
      );
      
      const secondChild = firstChild.children[0];
      if (secondChild && secondChild instanceof HTMLElement) {
        secondChild.setAttribute(
          'style',
          `position: relative; width: ${width}; max-width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 18px;`,
        );
      }
    }
  });

  body.querySelectorAll<HTMLIFrameElement>('iframe[src]').forEach((iframe) => {
    if (iframe.closest('div[data-video]')) {
      return;
    }

    const src = iframe.getAttribute('src') || '';

    if (!src) {
      return;
    }

    if (isDirectVideoFile(src)) {
      const video = document.createElement('video');
      video.setAttribute('src', src);
      video.setAttribute('controls', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('preload', 'metadata');
      iframe.replaceWith(video);
      return;
    }

    const normalizedSrc = normalizeEmbeddedVideoSrc(src);

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-video', 'true');
    wrapper.setAttribute('data-video-kind', 'embed');
    wrapper.setAttribute('data-video-src', normalizedSrc);
    wrapper.setAttribute('data-video-width', '100%');
    wrapper.setAttribute('data-video-align', 'center');
    
    const flexDiv = document.createElement('div');
    flexDiv.setAttribute('style', 'display: flex; justify-content: center;');
    
    const relativeDiv = document.createElement('div');
    relativeDiv.setAttribute('style', 'position: relative; width: 100%; max-width: 100%; aspect-ratio: 16 / 9; overflow: hidden;');
    
    // Create a new iframe with updated attributes instead of moving the existing one
    const newIframe = document.createElement('iframe');
    newIframe.setAttribute('src', normalizedSrc);
    newIframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
    newIframe.setAttribute('allowfullscreen', 'true');
    newIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    newIframe.setAttribute('width', '100%');
    newIframe.setAttribute('height', '100%');
    newIframe.setAttribute('style', 'position: absolute; inset: 0; width: 100%; height: 100%; border: 0;');
    
    relativeDiv.appendChild(newIframe);
    flexDiv.appendChild(relativeDiv);
    wrapper.appendChild(flexDiv);
    
    iframe.replaceWith(wrapper);
  });

  return body.innerHTML;
};



export const splitIntoParagraphs = (value: string | null | undefined) => {
  if (!value) {
    return [];
  }

  return value
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

export const getLocalizedText = (
  language: ActiveLanguage,
  english?: string | null,
  finnish?: string | null,
) => {
  if (language === 'fi') {
    return finnish || english || '';
  }

  return english || finnish || '';
};

export const getContentParagraphs = (
  language: ActiveLanguage,
  contents: PedagogicalContent[],
) =>
  contents
    .flatMap((content) => {
      const localizedContent = getLocalizedText(
        language,
        content.contentEn,
        content.contentFi,
      );
      const normalizedContent = looksLikeRichHtml(localizedContent)
        ? stripHtmlToText(localizedContent)
        : localizedContent;

      return splitIntoParagraphs(normalizedContent);
    })
    .filter(Boolean);

export const getSubChapterParagraphs = (
  language: ActiveLanguage,
  subChapter: SubChapter,
) => {
  const contentParagraphs = getContentParagraphs(
    language,
    subChapter.pedagogicalContents || [],
  );

  if (contentParagraphs.length > 0) {
    return contentParagraphs;
  }

  return splitIntoParagraphs(
    getLocalizedText(language, subChapter.descriptionEn, subChapter.descriptionFi),
  );
};

export const getChapterParagraphs = (
  language: ActiveLanguage,
  chapter: Chapter,
) => {
  const ownParagraphs = splitIntoParagraphs(
    getLocalizedText(language, chapter.descriptionEn, chapter.descriptionFi),
  );

  if (ownParagraphs.length > 0) {
    return ownParagraphs;
  }

  const firstSubChapter = chapter.subChapters?.[0];
  return firstSubChapter ? getSubChapterParagraphs(language, firstSubChapter) : [];
};

export const getOverviewParagraphs = (language: ActiveLanguage, course: Course) =>
  splitIntoParagraphs(
    getLocalizedText(language, course.descriptionEn, course.descriptionFi),
  );

export const getAuthorRole = (
  language: ActiveLanguage,
  author: Author,
  fallback: string,
) => getLocalizedText(language, author.roleEn, author.roleFi) || fallback;
