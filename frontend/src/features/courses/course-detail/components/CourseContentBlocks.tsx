import Image from 'next/image';
import {
  ActiveLanguage,
  SelectedContent,
  getLocalizedText,
  splitIntoParagraphs,
} from '../courseDetail.utils';
import styles from './CourseContentBlocks.module.css';
import richTextStyles from './CourseRichText.module.css';

interface CourseContentBlocksProps {
  activeLanguage: ActiveLanguage;
  selectedContent: SelectedContent;
}

const looksLikeRichHtml = (value: string) =>
  /<(p|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code|table|thead|tbody|tr|td|th|hr|a|strong|em|u|s|span)(\s|>)/i.test(
    value,
  );

const normalizeComparableText = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

export default function CourseContentBlocks({
  activeLanguage,
  selectedContent,
}: CourseContentBlocksProps) {
  if (selectedContent.kind !== 'subchapter' || !selectedContent.contentBlocks?.length) {
    return (
      <>
        {selectedContent.paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph}`} className={styles.contentParagraph}>
            {paragraph}
          </p>
        ))}
      </>
    );
  }

  return (
    <>
      {selectedContent.contentBlocks.map((contentBlock) => {
        const localizedTitle = getLocalizedText(
          activeLanguage,
          contentBlock.titleEn,
          contentBlock.titleFi,
        );
        const shouldRenderTitle =
          localizedTitle.trim().length > 0 &&
          normalizeComparableText(localizedTitle) !==
            normalizeComparableText(selectedContent.title);
        const localizedContent = getLocalizedText(
          activeLanguage,
          contentBlock.contentEn,
          contentBlock.contentFi,
        );
        const contentParagraphs = splitIntoParagraphs(localizedContent);
        const renderRichText =
          contentBlock.type === 'text' && looksLikeRichHtml(localizedContent);

        return (
          <section key={contentBlock.id} className={styles.contentBlock}>
            {shouldRenderTitle ? (
              <div className={styles.contentBlockHeader}>
                <h3 className={styles.contentBlockTitle}>{localizedTitle}</h3>
              </div>
            ) : null}

            {contentBlock.type === 'image' && contentBlock.url ? (
              <div className={styles.contentImageWrap}>
                <Image
                  src={contentBlock.url}
                  alt={localizedTitle}
                  width={900}
                  height={540}
                  className={styles.contentImage}
                />
              </div>
            ) : null}

            {renderRichText ? (
              <div
                className={richTextStyles.richTextContent}
                dangerouslySetInnerHTML={{ __html: localizedContent }}
              />
            ) : contentParagraphs.length > 0 ? (
              contentParagraphs.map((paragraph, index) => (
                <p
                  key={`${contentBlock.id}-${index}-${paragraph}`}
                  className={styles.contentParagraph}
                >
                  {paragraph}
                </p>
              ))
            ) : null}

            {contentBlock.url && ['video', 'link', 'pdf'].includes(contentBlock.type) ? (
              <a
                href={contentBlock.url}
                target="_blank"
                rel="noreferrer"
                className={styles.contentResourceLink}
              >
                {contentBlock.url}
              </a>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
