'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import styles from './page.module.css';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  occupation: string;
};

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

function AccountPageContent() {
  const { t } = useTranslation('auth');
  const { user, updateProfile, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    occupation: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Keep the editable fields synced with the current authenticated user.
  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      occupation: user.occupation || '',
    });
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return '';
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email.split('@')[0];
  }, [user]);

  const avatarText = useMemo(() => {
    if (!user) {
      return 'U';
    }

    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();

    return initials || user.email.slice(0, 1).toUpperCase();
  }, [user]);

  const planLabel = useMemo(() => {
    if (!user) {
      return '';
    }

    return user.plan === UserPlan.PREMIUM
      ? t('navbar.badges.premium')
      : t('navbar.badges.free');
  }, [t, user]);

  const roleLabel = useMemo(() => {
    if (!user) {
      return '';
    }

    if (user.role === UserRole.ADMIN) {
      return t('navbar.badges.admin');
    }

    if (user.role === UserRole.CREATOR) {
      return t('navbar.badges.creator');
    }

    return t('navbar.badges.user');
  }, [t, user]);

  const joinedAt = useMemo(() => {
    if (!user?.createdAt) {
      return '-';
    }

    return new Date(user.createdAt).toLocaleDateString();
  }, [user]);

  const planToneClass = useMemo(() => {
    if (!user) {
      return '';
    }

    return user.plan === UserPlan.PREMIUM ? styles.premiumTone : styles.freeTone;
  }, [user]);

  const roleToneClass = useMemo(() => {
    if (!user) {
      return '';
    }

    if (user.role === UserRole.ADMIN) {
      return styles.adminTone;
    }

    if (user.role === UserRole.CREATOR) {
      return styles.creatorTone;
    }

    return styles.userTone;
  }, [user]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setProfileMessage(t('account.profileSaved'));
    } catch (error) {
      setProfileError(getApiErrorMessage(error, t('account.profileFailed')));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    // Mirror the auth validation rules on the client so users get fast feedback.
    if (!currentPassword.trim()) {
      setPasswordError(t('account.currentPasswordRequired'));
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError(t('account.newPasswordRequired'));
      return;
    }

    if (!confirmPassword.trim()) {
      setPasswordError(t('account.confirmPasswordRequired'));
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(t('password.minLength'));
      return;
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      const hasUppercase = /[A-Z]/.test(newPassword);

      setPasswordError(
        !hasUppercase ? t('password.noUppercase') : t('password.noNumber'),
      );
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(t('alerts.samePasswordMessage'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('account.passwordMismatch'));
      return;
    }

    setIsSavingPassword(true);

    try {
      const message = await changePassword(currentPassword, newPassword);
      setPasswordMessage(message || t('account.passwordSaved'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(getApiErrorMessage(error, t('account.passwordFailed')));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const passwordChecks = [
    {
      key: 'length',
      label: t('register.requirement1'),
      isValid: newPassword.length >= PASSWORD_MIN_LENGTH,
    },
    {
      key: 'uppercase',
      label: t('register.requirement2'),
      isValid: /[A-Z]/.test(newPassword),
    },
    {
      key: 'number',
      label: t('register.requirement3'),
      isValid: /\d/.test(newPassword),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.heroIdentity}>
            <span className={styles.avatar}>{avatarText}</span>
            <div>
              <p className={styles.eyebrow}>{t('account.title')}</p>
              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.subtitle}>{t('account.subtitle')}</p>
            </div>
          </div>

          <div className={styles.badges}>
            <span className={`${styles.badgePrimary} ${planToneClass}`}>{planLabel}</span>
            <span className={`${styles.badgeMuted} ${roleToneClass}`}>{roleLabel}</span>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>{t('account.accountSection')}</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>{t('account.email')}</dt>
                <dd className={styles.summaryValue}>{user.email}</dd>
              </div>
              <div>
                <dt>{t('account.role')}</dt>
                <dd className={`${styles.summaryValue} ${roleToneClass}`}>{roleLabel}</dd>
              </div>
              <div>
                <dt>{t('account.plan')}</dt>
                <dd className={`${styles.summaryValue} ${planToneClass}`}>{planLabel}</dd>
              </div>
              <div>
                <dt>{t('account.joined')}</dt>
                <dd className={styles.summaryValue}>{joinedAt}</dd>
              </div>
            </dl>

            <div className={styles.summaryActions}>
              <button
                type="button"
                className={`${styles.summaryActionButton} ${
                  activeSection === 'profile' ? styles.summaryActionButtonActive : ''
                }`}
                onClick={() => setActiveSection('profile')}
              >
                {t('account.profileSection')}
              </button>
              <button
                type="button"
                className={`${styles.summaryActionButton} ${
                  activeSection === 'security' ? styles.summaryActionButtonActive : ''
                }`}
                onClick={() => setActiveSection('security')}
              >
                {t('account.securitySection')}
              </button>
            </div>
          </aside>

          <div className={styles.formsColumn}>
            {activeSection === 'profile' ? (
              <section className={styles.formCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.sectionTitle}>{t('account.profileSection')}</h2>
                  <p className={styles.sectionDescription}>{t('account.profileDescription')}</p>
                </div>

                <form className={styles.form} onSubmit={handleProfileSubmit}>
                  <label className={styles.field}>
                    <span>{t('account.firstName')}</span>
                    <input
                      value={profileForm.firstName}
                      onChange={(event) =>
                        setProfileForm((previous) => ({
                          ...previous,
                          firstName: event.target.value,
                        }))
                      }
                      placeholder={t('account.firstNamePlaceholder')}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t('account.lastName')}</span>
                    <input
                      value={profileForm.lastName}
                      onChange={(event) =>
                        setProfileForm((previous) => ({
                          ...previous,
                          lastName: event.target.value,
                        }))
                      }
                      placeholder={t('account.lastNamePlaceholder')}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>{t('account.occupation')}</span>
                    <input
                      value={profileForm.occupation}
                      onChange={(event) =>
                        setProfileForm((previous) => ({
                          ...previous,
                          occupation: event.target.value,
                        }))
                      }
                      placeholder={t('account.occupationPlaceholder')}
                    />
                  </label>

                  {profileMessage ? <p className={styles.successMessage}>{profileMessage}</p> : null}
                  {profileError ? <p className={styles.errorMessage}>{profileError}</p> : null}

                  <button type="submit" className={styles.primaryButton} disabled={isSavingProfile}>
                    {isSavingProfile ? t('account.savingProfile') : t('account.saveProfile')}
                  </button>
                </form>
              </section>
            ) : (
              <section className={`${styles.formCard} ${styles.securityCard}`}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.sectionTitle}>{t('account.securitySection')}</h2>
                  <p className={styles.sectionDescription}>{t('account.securityDescription')}</p>
                </div>

                <form className={`${styles.form} ${styles.securityForm}`} onSubmit={handlePasswordSubmit}>
                  <label className={styles.fieldWide}>
                    <span>{t('account.currentPassword')}</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder={t('account.currentPasswordPlaceholder')}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>{t('account.newPassword')}</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder={t('account.newPasswordPlaceholder')}
                    />
                    {newPassword ? (
                      <div className={styles.passwordRequirements}>
                        {passwordChecks.map((requirement) => (
                          <div key={requirement.key} className={styles.passwordRequirement}>
                            <span
                              className={`${styles.requirementDot} ${
                                requirement.isValid
                                  ? styles.requirementDotValid
                                  : styles.requirementDotInvalid
                              }`}
                            />
                            <span
                              className={`${styles.requirementLabel} ${
                                requirement.isValid
                                  ? styles.requirementLabelValid
                                  : styles.requirementLabelInvalid
                              }`}
                            >
                              {requirement.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </label>

                  <label className={styles.fieldWide}>
                    <span>{t('account.confirmPassword')}</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={t('account.confirmPasswordPlaceholder')}
                    />
                  </label>

                  {passwordMessage ? <p className={styles.successMessage}>{passwordMessage}</p> : null}
                  {passwordError ? <p className={styles.errorMessage}>{passwordError}</p> : null}

                  <button type="submit" className={styles.primaryButton} disabled={isSavingPassword}>
                    {isSavingPassword ? t('account.savingPassword') : t('account.savePassword')}
                  </button>
                </form>
              </section>
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
