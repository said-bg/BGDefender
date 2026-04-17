import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { ListItem } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import { Dropcursor, Gapcursor, Placeholder, TrailingNode } from '@tiptap/extensions';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { History } from 'reactjs-tiptap-editor/history';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Image } from 'reactjs-tiptap-editor/image';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { Link } from 'reactjs-tiptap-editor/link';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { TaskList } from 'reactjs-tiptap-editor/tasklist';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Video } from 'reactjs-tiptap-editor/video';

type BuildRichTextExtensionsParams = {
  placeholder: string;
  uploadMedia: (file: File) => Promise<string>;
};

export const BLOCK_OPTIONS = [
  { label: 'Block', value: 'paragraph' },
  { label: 'Heading 1', value: '1' },
  { label: 'Heading 2', value: '2' },
  { label: 'Heading 3', value: '3' },
];

export const FONT_FAMILY_OPTIONS = [
  { label: 'Font', value: 'Default' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
];

export const FONT_SIZE_OPTIONS = [
  { label: 'Size', value: 'Default' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
];

const parsePixelWidth = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatMediaWidth = (value: string | number | null | undefined, fallback = '960px') => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
};

const isDirectVideoFile = (src: string | null | undefined) => {
  if (!src) {
    return false;
  }

  try {
    const normalized = new URL(src, 'http://localhost').pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(normalized);
  } catch {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(src.toLowerCase());
  }
};

const normalizeEmbeddedVideoSrc = (src: string | null | undefined) => {
  if (!src) {
    return '';
  }

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

const AppImage = Image.extend({
  inline() {
    return false;
  },
  group() {
    return 'block';
  },
  addAttributes() {
    const parentAttributes = this.parent?.call(this) ?? {};

    return {
      ...parentAttributes,
      width: {
        ...(parentAttributes as Record<string, unknown>).width ?? {},
        parseHTML: (element: HTMLElement) => {
          const width = element.getAttribute('width') || element.getAttribute('data-image-width');
          return parsePixelWidth(width) || 960;
        },
      },
      align: {
        ...(parentAttributes as Record<string, unknown>).align ?? {},
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('align') || element.getAttribute('data-image-align') || 'center',
      },
      inline: {
        ...(parentAttributes as Record<string, unknown>).inline ?? {},
        parseHTML: () => false,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            width: parsePixelWidth(element.getAttribute('width') || element.getAttribute('data-image-width')) || 960,
            align: element.getAttribute('align') || element.getAttribute('data-image-align') || 'center',
            inline: false,
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    const width = node.attrs.width || 960;
    const align = node.attrs.align || 'center';
    const widthValue = typeof width === 'number' ? width : parsePixelWidth(String(width)) || 960;
    const widthStyle = `${widthValue}px`;
    let styleStr = `width: ${widthStyle}; max-width: 100%; height: auto; display: block; float: none;`;
    if (align === 'center') {
      styleStr += ' margin: 1rem auto;';
    } else if (align === 'right') {
      styleStr += ' margin: 1rem 0 1rem auto;';
    } else {
      styleStr += ' margin: 1rem 0;';
    }

    return [
      'img',
      {
        ...HTMLAttributes,
        width: widthValue,
        'data-image-width': `${widthValue}px`,
        align,
        'data-image-align': align,
        style: styleStr,
      },
    ];
  },
});

const AppVideo = Video.extend({
  addAttributes() {
    const parentAttributes = this.parent?.call(this) ?? {};

    return {
      ...parentAttributes,
      width: {
        ...(parentAttributes as Record<string, unknown>).width ?? {},
        parseHTML: (element: HTMLElement) => {
          const wrapper = element.closest('div[data-video]');
          return wrapper?.getAttribute('data-video-width') || '100%';
        },
      },
      align: {
        ...(parentAttributes as Record<string, unknown>).align ?? {},
        parseHTML: (element: HTMLElement) => {
          const wrapper = element.closest('div[data-video]');
          return wrapper?.getAttribute('data-video-align') || 'center';
        },
      },
      mediaType: {
        default: 'embed',
        parseHTML: (element: HTMLElement) => {
          const wrapper = element.closest('div[data-video]');
          const src = element.getAttribute('src');

          return (
            wrapper?.getAttribute('data-video-kind') ||
            (isDirectVideoFile(src) ? 'file' : 'embed')
          );
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-video] video',
        priority: 100,
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          const wrapper = element.closest('div[data-video]');
          return {
            src: wrapper?.getAttribute('data-video-src') || element.getAttribute('src'),
            width: wrapper?.getAttribute('data-video-width') || '100%',
            align: wrapper?.getAttribute('data-video-align') || 'center',
            mediaType: 'file',
          };
        },
      },
      {
        tag: 'div[data-video] iframe',
        priority: 100,
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          const wrapper = element.closest('div[data-video]');
          return {
            src: wrapper?.getAttribute('data-video-src') || element.getAttribute('src'),
            width: wrapper?.getAttribute('data-video-width') || '100%',
            align: wrapper?.getAttribute('data-video-align') || 'center',
            mediaType: 'embed',
          };
        },
      },
      {
        tag: 'video[src]',
        priority: 60,
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          return {
            src: element.getAttribute('src'),
            width: '100%',
            align: 'center',
            mediaType: 'file',
          };
        },
      },
      {
        tag: 'iframe[src]',
        priority: 50,
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          // Try to find wrapper for recovery of data-video attributes
          const wrapper = element.closest('div[data-video]');
          return {
            src: wrapper?.getAttribute('data-video-src') || element.getAttribute('src'),
            width: wrapper?.getAttribute('data-video-width') || '100%',
            align: wrapper?.getAttribute('data-video-align') || 'center',
            mediaType: 'embed',
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    const width = node.attrs.width || '100%';
    const align = node.attrs.align || 'center';
    const mediaWidth = formatMediaWidth(width, '100%');
    const src = (node.attrs.src as string | null | undefined) || HTMLAttributes.src;
    const mediaType =
      node.attrs.mediaType === 'file' || isDirectVideoFile(src) ? 'file' : 'embed';
    const normalizedSrc = mediaType === 'file' ? src : normalizeEmbeddedVideoSrc(src);

    if (mediaType === 'file') {
      return [
        'div',
        {
          class: 'video-file-wrapper',
          'data-video': 'true',
          'data-video-kind': 'file',
          'data-video-src': String(src || ''),
          'data-video-width': String(width),
          'data-video-align': String(align),
        },
        [
          'div',
          {
            style: `display: flex; justify-content: ${align};`,
          },
          [
            'video',
            {
              src,
              controls: 'true',
              playsinline: 'true',
              preload: 'metadata',
              style: `width: ${mediaWidth}; max-width: 100%; height: auto; display: block;`,
            },
          ],
        ],
      ];
    }

    return [
      'div',
      {
        class: 'iframe-wrapper',
        'data-video': 'true',
        'data-video-kind': 'embed',
        'data-video-src': String(normalizedSrc || ''),
        'data-video-width': String(width),
        'data-video-align': String(align),
      },
      [
        'div',
        {
          style: `display: flex; justify-content: ${align};`,
        },
        [
          'div',
          {
            style: `position: relative; width: ${mediaWidth}; max-width: 100%; aspect-ratio: 16 / 9; overflow: hidden;`,
          },
          [
            'iframe',
            {
              ...HTMLAttributes,
              src: normalizedSrc,
              width: '100%',
              height: '100%',
              allow:
                'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
              allowfullscreen: 'true',
              referrerpolicy: 'strict-origin-when-cross-origin',
              style: 'position: absolute; inset: 0; width: 100%; height: 100%; border: 0;',
            },
          ],
        ],
      ],
    ];
  },
});

export function buildRichTextBlockExtensions({
  placeholder,
  uploadMedia,
}: BuildRichTextExtensionsParams) {
  return [
    Document,
    Text,
    Dropcursor.configure({
      color: '#111827',
      width: 2,
    }),
    Gapcursor,
    HardBreak,
    Paragraph,
    TrailingNode,
    ListItem,
    TextStyle,
    FontFamily.configure({
      fontFamilyList: FONT_FAMILY_OPTIONS.map(({ label, value }) => ({
        name: label,
        value,
      })),
    }),
    FontSize.configure({
      fontSizes: FONT_SIZE_OPTIONS.map(({ value }) => value).filter((value) => value !== 'Default'),
    }),
    Placeholder.configure({
      placeholder,
    }),
    History,
    Heading,
    Bold,
    TextUnderline,
    Italic,
    Strike,
    BulletList,
    OrderedList,
    TaskList,
    Blockquote,
    TextAlign,
    Link,
    AppImage.configure({
      upload: uploadMedia,
      resourceImage: 'both',
      multiple: false,
      enableAlt: true,
      defaultInline: false,
    }),
    AppVideo.configure({
      upload: uploadMedia,
      resourceVideo: 'both',
      videoProviders: ['.'],
      width: '100%',
    }),
    HorizontalRule,
  ];
}
