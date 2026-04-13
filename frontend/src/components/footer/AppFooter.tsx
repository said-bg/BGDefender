'use client';

import { useTranslation } from 'react-i18next';
import styles from './AppFooter.module.css';

export default function AppFooter() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <p className={styles.text}>
          {`Copyright ${currentYear} ${t('footer.rights')}`}
        </p>
      </div>
    </footer>
  );
}
