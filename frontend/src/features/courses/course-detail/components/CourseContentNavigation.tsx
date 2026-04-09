import type { TFunction } from 'i18next';
import { NavigationItem, ViewState } from '../courseDetail.utils';
import styles from './CourseContentNavigation.module.css';

interface CourseContentNavigationProps {
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
  previousItem: NavigationItem | null;
  t: TFunction<'courses', undefined>;
}

export default function CourseContentNavigation({
  nextItem,
  onNavigateToView,
  previousItem,
  t,
}: CourseContentNavigationProps) {
  return (
    <div className={styles.navigationFooter}>
      <button
        type="button"
        className={styles.navigationButton}
        onClick={() => previousItem && onNavigateToView(previousItem.view)}
        disabled={!previousItem}
      >
        {t('detail.previous')}
      </button>
      <button
        type="button"
        className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
        onClick={() => nextItem && onNavigateToView(nextItem.view)}
        disabled={!nextItem}
      >
        {t('detail.next')}
      </button>
    </div>
  );
}
