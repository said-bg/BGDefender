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

const AppImage = Image.extend({
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

    let styleStr = `width: ${widthStyle}; height: auto;`;
    if (align === 'center') {
      styleStr += ' display: block; margin: 0 auto;';
    } else if (align === 'left') {
      styleStr += ' float: left; margin: 0 15px 10px 0;';
    } else if (align === 'right') {
      styleStr += ' float: right; margin: 0 0 10px 15px;';
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
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-video] iframe',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          const wrapper = element.closest('div[data-video]');
          return {
            src: element.getAttribute('src'),
            width: wrapper?.getAttribute('data-video-width') || '100%',
            align: wrapper?.getAttribute('data-video-align') || 'center',
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
          return {
            src: element.getAttribute('src'),
            width: '100%',
            align: 'center',
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    const width = node.attrs.width || '100%';
    const align = node.attrs.align || 'center';
    const mediaWidth = formatMediaWidth(width, '100%');

    return [
      'div',
      {
        class: 'iframe-wrapper',
        'data-video': '',
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
              src: HTMLAttributes.src,
              width: '100%',
              height: '100%',
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
