'use client';

import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/auth';
import AccountHero from './components/AccountHero';
import AccountSummaryCard from './components/AccountSummaryCard';
import ProfileForm from './components/ProfileForm';
import SecurityForm from './components/SecurityForm';
import { useAccountSettings } from './hooks/useAccountSettings';
import styles from './AccountPage.module.css';

function AccountPageContent() {
  const { t } = useTranslation('account');
  const account = useAccountSettings();

  if (!account.user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <AccountHero
          avatarText={account.avatarText}
          displayName={account.displayName}
          isAdmin={account.isAdmin}
          isStandardUser={account.isStandardUser}
          planLabel={account.planLabel}
          planToneClass={account.planToneClass}
          roleLabel={account.roleLabel}
          roleToneClass={account.roleToneClass}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <div className={styles.layout}>
          <AccountSummaryCard
            accountLabel={t('accountSection')}
            activeSection={account.activeSection}
            email={account.user.email}
            emailLabel={t('email')}
            joinedAt={account.joinedAt}
            joinedLabel={t('joined')}
            isStandardUser={account.isStandardUser}
            planLabel={account.planLabel}
            planToneClass={account.planToneClass}
            planTitleLabel={t('plan')}
            profileLabel={t('profileSection')}
            roleLabel={account.roleLabel}
            roleToneClass={account.roleToneClass}
            roleTitleLabel={t('role')}
            securityLabel={t('securitySection')}
            onSelectSection={account.setActiveSection}
          />

          <div className={styles.formsColumn}>
            {account.activeSection === 'profile' ? (
              <ProfileForm
                description={t('profileDescription')}
                error={account.profileError}
                firstNameLabel={t('firstName')}
                firstNamePlaceholder={t('firstNamePlaceholder')}
                isSaving={account.isSavingProfile}
                lastNameLabel={t('lastName')}
                lastNamePlaceholder={t('lastNamePlaceholder')}
                message={account.profileMessage}
                occupationLabel={t('occupation')}
                occupationPlaceholder={t('occupationPlaceholder')}
                onChange={account.setProfileForm}
                onSubmit={account.handleProfileSubmit}
                saveLabel={t('saveProfile')}
                savingLabel={t('savingProfile')}
                title={t('profileSection')}
                value={account.profileForm}
              />
            ) : (
              <SecurityForm
                confirmPassword={account.confirmPassword}
                confirmPasswordLabel={t('confirmPassword')}
                confirmPasswordPlaceholder={t('confirmPasswordPlaceholder')}
                currentPassword={account.currentPassword}
                currentPasswordLabel={t('currentPassword')}
                currentPasswordPlaceholder={t('currentPasswordPlaceholder')}
                description={t('securityDescription')}
                error={account.passwordError}
                isSaving={account.isSavingPassword}
                message={account.passwordMessage}
                newPassword={account.newPassword}
                newPasswordLabel={t('newPassword')}
                newPasswordPlaceholder={t('newPasswordPlaceholder')}
                onConfirmPasswordChange={account.setConfirmPassword}
                onCurrentPasswordChange={account.setCurrentPassword}
                onNewPasswordChange={account.setNewPassword}
                onSubmit={account.handlePasswordSubmit}
                passwordChecks={account.passwordChecks}
                saveLabel={t('savePassword')}
                savingLabel={t('savingPassword')}
                title={t('securitySection')}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageContent />
    </ProtectedRoute>
  );
}
