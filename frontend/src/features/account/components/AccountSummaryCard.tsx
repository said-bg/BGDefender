import type { AccountSection } from '../lib/account.types';
import styles from './AccountSummary.module.css';

type AccountSummaryCardProps = {
  activeSection: AccountSection;
  accountLabel: string;
  email: string;
  emailLabel: string;
  isStandardUser: boolean;
  joinedAt: string;
  joinedLabel: string;
  planLabel: string;
  planToneClass: string;
  planTitleLabel: string;
  profileLabel: string;
  roleLabel: string;
  roleToneClass: string;
  roleTitleLabel: string;
  securityLabel: string;
  onSelectSection: (section: AccountSection) => void;
};

export default function AccountSummaryCard({
  accountLabel,
  activeSection,
  email,
  emailLabel,
  isStandardUser,
  joinedAt,
  joinedLabel,
  onSelectSection,
  planLabel,
  planToneClass,
  planTitleLabel,
  profileLabel,
  roleLabel,
  roleTitleLabel,
  roleToneClass,
  securityLabel,
}: AccountSummaryCardProps) {
  return (
    <aside className={styles.summaryCard}>
      <h2 className={styles.sectionTitle}>{accountLabel}</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>{emailLabel}</dt>
          <dd className={styles.summaryValue}>{email}</dd>
        </div>
        <div>
          <dt>{isStandardUser ? planTitleLabel : roleTitleLabel}</dt>
          <dd
            className={`${styles.summaryValue} ${
              isStandardUser ? planToneClass : roleToneClass
            }`}
          >
            {isStandardUser ? planLabel : roleLabel}
          </dd>
        </div>
        <div>
          <dt>{joinedLabel}</dt>
          <dd className={styles.summaryValue}>{joinedAt}</dd>
        </div>
      </dl>

      <div className={styles.summaryActions}>
        <button
          type="button"
          className={`${styles.summaryActionButton} ${
            activeSection === 'profile' ? styles.summaryActionButtonActive : ''
          }`}
          onClick={() => onSelectSection('profile')}
        >
          {profileLabel}
        </button>
        <button
          type="button"
          className={`${styles.summaryActionButton} ${
            activeSection === 'security' ? styles.summaryActionButtonActive : ''
          }`}
          onClick={() => onSelectSection('security')}
        >
          {securityLabel}
        </button>
      </div>
    </aside>
  );
}
