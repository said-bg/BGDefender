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
  const handleNavigate = (item: NavigationItem | null) => {
    if (!item) {
      return;
    }

    onNavigateToView(item.view);

    const contentPanel = document.querySelector<HTMLElement>('[data-course-content-panel]');
    if (contentPanel) {
      contentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.navigationFooter}>
      <button
        type="button"
        className={styles.navigationButton}
        onClick={() => handleNavigate(previousItem)}
        disabled={!previousItem}
      >
        {t('detail.previous')}
      </button>
      <button
        type="button"
        className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
        onClick={() => handleNavigate(nextItem)}
        disabled={!nextItem}
      >
        {t('detail.next')}
      </button>
    </div>
  );
}
