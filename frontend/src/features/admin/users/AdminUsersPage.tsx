'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserPlan, UserRole } from '@/types/api';
import useAdminUsers from './useAdminUsers';
import styles from './AdminUsersPage.module.css';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminUsersPageContent />
    </ProtectedRoute>
  );
}

function AdminUsersPageContent() {
  const { t } = useTranslation('admin');
  const {
    actingUserId,
    canManagePlan,
    error,
    handleDeleteUser,
    handleToggleActive,
    handleToggleCreator,
    handleTogglePlan,
    loading,
    message,
    planFilter,
    preparedUsers,
    roleFilter,
    search,
    setPlanFilter,
    setRoleFilter,
    setSearch,
    summary,
  } = useAdminUsers();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/admin" className={styles.backLink}>
            {t('backToOverview')}
          </Link>
          <p className={styles.eyebrow}>
            {t('users.eyebrow')}
          </p>
          <h1 className={styles.title}>
            {t('users.title')}
          </h1>
          <p className={styles.subtitle}>
            {t('users.subtitle')}
          </p>
        </div>
      </section>

      {message ? <p className={styles.successMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <section className={styles.summary}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('users.summaryVisible')}
          </span>
          <strong className={styles.summaryValue}>{summary.visible}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('users.summaryPremium')}
          </span>
          <strong className={styles.summaryValue}>{summary.premium}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('users.summaryCreators')}
          </span>
          <strong className={styles.summaryValue}>{summary.creators}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('users.summaryInactive')}
          </span>
          <strong className={styles.summaryValue}>{summary.inactive}</strong>
        </article>
      </section>

      <section className={styles.filters}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('users.searchPlaceholder')}
        />
        <select
          className={styles.selectInput}
          value={planFilter}
          onChange={(event) => setPlanFilter(event.target.value as 'all' | UserPlan)}
        >
          <option value="all">
            {t('users.filterAllPlans')}
          </option>
          <option value={UserPlan.FREE}>
            {t('levels.free')}
          </option>
          <option value={UserPlan.PREMIUM}>
            {t('levels.premium')}
          </option>
        </select>
        <select
          className={styles.selectInput}
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
        >
          <option value="all">
            {t('users.filterAllRoles')}
          </option>
          <option value={UserRole.USER}>
            {t('users.roleUser')}
          </option>
          <option value={UserRole.CREATOR}>
            {t('users.roleCreator')}
          </option>
          <option value={UserRole.ADMIN}>
            {t('users.roleAdmin')}
          </option>
        </select>
      </section>

      {loading ? (
        <p className={styles.statusMessage}>
          {t('loading')}
        </p>
      ) : preparedUsers.length === 0 ? (
        <section className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            {t('users.emptyTitle')}
          </h2>
          <p className={styles.emptyDescription}>
            {t('users.empty')}
          </p>
        </section>
      ) : (
        <section className={styles.list}>
          {preparedUsers.map((user) => {
            const isActing = actingUserId === user.id;
            const showPlan = canManagePlan(user);
            const planBadgeClass =
              user.plan === UserPlan.PREMIUM
                ? styles.badgePremium
                : styles.badgeFree;
            const roleBadgeClass =
              user.role === UserRole.ADMIN
                ? styles.badgeAdmin
                : user.role === UserRole.CREATOR
                  ? styles.badgeCreator
                  : styles.badgeUser;

            return (
              <article key={user.id} className={styles.card}>
                <div className={styles.identity}>
                  <span className={styles.avatar}>{user.initials}</span>
                  <div className={styles.identityText}>
                    <h2 className={styles.userName}>{user.displayName}</h2>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                </div>

                <div className={styles.meta}>
                  {showPlan ? (
                    <span className={`${styles.badge} ${planBadgeClass}`}>
                      {user.plan === UserPlan.PREMIUM
                        ? t('levels.premium')
                        : t('levels.free')}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`${styles.badge} ${styles.badgePlaceholder}`}
                    />
                  )}
                  <span className={`${styles.badge} ${roleBadgeClass}`}>
                    {user.role === UserRole.ADMIN
                      ? t('users.roleAdmin')
                      : user.role === UserRole.CREATOR
                        ? t('users.roleCreator')
                        : t('users.roleUser')}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      user.isActive ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {user.isActive
                      ? t('users.active')
                      : t('users.inactive')}
                  </span>
                </div>

                <div className={styles.actions}>
                  {showPlan ? (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => void handleTogglePlan(user)}
                      disabled={isActing}
                    >
                      {user.plan === UserPlan.PREMIUM
                        ? t('users.removePremium')
                        : t('users.grantPremium')}
                    </button>
                  ) : (
                    <span aria-hidden="true" className={styles.actionPlaceholder} />
                  )}

                  {user.role !== UserRole.ADMIN ? (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => void handleToggleCreator(user)}
                      disabled={isActing}
                    >
                      {user.role === UserRole.CREATOR
                        ? t('users.removeCreator')
                        : t('users.grantCreator')}
                    </button>
                  ) : (
                    <span aria-hidden="true" className={styles.actionPlaceholder} />
                  )}

                  <button
                    type="button"
                    className={`${styles.actionButton} ${
                      !user.isActive ? styles.dangerAction : ''
                    }`}
                    onClick={() => void handleToggleActive(user)}
                    disabled={isActing || user.isCurrentAdmin}
                  >
                    {user.isActive
                      ? t('users.deactivate')
                      : t('users.reactivate')}
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.dangerAction}`}
                    onClick={() => void handleDeleteUser(user)}
                    disabled={isActing || user.isCurrentAdmin}
                  >
                    {t('users.deleteShort')}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
