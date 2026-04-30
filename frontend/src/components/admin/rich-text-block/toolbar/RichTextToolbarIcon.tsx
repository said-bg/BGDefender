import { memo } from 'react';
import type { ReactNode } from 'react';

export type ToolbarIconName =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'code'
  | 'codeBlock'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'link'
  | 'image'
  | 'imageUpload'
  | 'video'
  | 'videoUpload'
  | 'pdf'
  | 'pdfUpload'
  | 'horizontalRule';

type RichTextToolbarIconProps = {
  name: ToolbarIconName;
};

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" focusable="false" aria-hidden="true">
      {children}
    </svg>
  );
}

function RichTextToolbarIcon({ name }: RichTextToolbarIconProps) {
  switch (name) {
    case 'undo':
      return (
        <SvgIcon>
          <path d="M8 5 4 9l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9h6a4 4 0 1 1 0 8H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
      );
    case 'redo':
      return (
        <SvgIcon>
          <path d="m12 5 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 9H9a4 4 0 1 0 0 8h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
      );
    case 'bold':
      return <span aria-hidden="true"><strong>B</strong></span>;
    case 'code':
      return <span aria-hidden="true">{'</>'}</span>;
    case 'codeBlock':
      return (
        <SvgIcon>
          <path d="m7 5-4 5 4 5M13 5l4 5-4 5M10.5 4 9 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
      );
    case 'italic':
      return <span aria-hidden="true"><em>I</em></span>;
    case 'underline':
      return <span aria-hidden="true" style={{ textDecoration: 'underline' }}>U</span>;
    case 'strike':
      return <span aria-hidden="true" style={{ textDecoration: 'line-through' }}>S</span>;
    case 'bulletList':
      return (
        <SvgIcon>
          <circle cx="4" cy="5" r="1.2" fill="currentColor" />
          <circle cx="4" cy="10" r="1.2" fill="currentColor" />
          <circle cx="4" cy="15" r="1.2" fill="currentColor" />
          <path d="M8 5h8M8 10h8M8 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'orderedList':
      return (
        <SvgIcon>
          <path d="M3.2 4.5h2M4 4v5M3.2 10h2M3.2 9l1.5-1.5a1 1 0 0 0-1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5h8M8 10h8M8 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'taskList':
      return (
        <SvgIcon>
          <rect x="2.7" y="3.7" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2.7" y="8.7" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.5" />
          <path d="m3.4 10.1.8.8 1.4-1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5h8M8 10h8M8 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'blockquote':
      return (
        <SvgIcon>
          <path d="M5.5 6.5h3l-2 3v4h-3v-4l2-3Zm7 0h3l-2 3v4h-3v-4l2-3Z" fill="currentColor" />
        </SvgIcon>
      );
    case 'alignLeft':
      return (
        <SvgIcon>
          <path d="M4 5h12M4 9h8M4 13h12M4 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'alignCenter':
      return (
        <SvgIcon>
          <path d="M4 5h12M6 9h8M4 13h12M6 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'alignRight':
      return (
        <SvgIcon>
          <path d="M4 5h12M8 9h8M4 13h12M8 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'link':
      return (
        <SvgIcon>
          <path d="M8 12.5 12.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 7.5 5.5 9a2.5 2.5 0 1 0 3.5 3.5l1.5-1.5M13 12.5l1.5-1.5A2.5 2.5 0 0 0 11 7.5L9.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
      );
    case 'image':
      return (
        <SvgIcon>
          <rect x="2.5" y="3.5" width="15" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="7" cy="8" r="1.4" fill="currentColor" />
          <path d="m5 14 3.5-3 2.5 2 2.5-2.5L16 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
      );
    case 'imageUpload':
      return (
        <SvgIcon>
          <rect x="2.5" y="5.5" width="11.5" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m5 13 2.6-2.2 2 1.6 1.7-1.7 2.7 2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 4h3m-1.5-1.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'video':
      return (
        <SvgIcon>
          <rect x="2.5" y="4" width="15" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m8 7.5 5 2.5-5 2.5Z" fill="currentColor" />
        </SvgIcon>
      );
    case 'videoUpload':
      return (
        <SvgIcon>
          <rect x="2.5" y="6" width="11.5" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m7.8 8.7 3.6 2-3.6 2Z" fill="currentColor" />
          <path d="M15 4h3m-1.5-1.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'pdf':
      return (
        <SvgIcon>
          <path d="M6 2.8h6l3 3V17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 2.8v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7.2 13.8h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'pdfUpload':
      return (
        <SvgIcon>
          <path d="M5.5 4.5h6l3 3V17a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M11.5 4.5v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M14.8 3h3m-1.5-1.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </SvgIcon>
      );
    case 'horizontalRule':
      return (
        <SvgIcon>
          <path d="M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </SvgIcon>
      );
    default:
      return null;
  }
}

export default memo(RichTextToolbarIcon);
