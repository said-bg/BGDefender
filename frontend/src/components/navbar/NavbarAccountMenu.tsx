'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { User, UserPlan, UserRole } from '@/types/api';
import styles from './NavbarAccountMenu.module.css';

interface NavbarAccountMenuLabels {
  admin: string;
  adminBadge: string;
  certificates: string;
  creatorBadge: string;
  freeBadge: string;
  logout: string;
  premiumBadge: string;
  profile: string;
  resources: string;
  userBadge: string;
}

interface NavbarAccountMenuProps {
  labels: NavbarAccountMenuLabels;
  logout: () => void | Promise<void>;
  user: User;
}

export default function NavbarAccountMenu({ labels, logout, user }: NavbarAccountMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = useMemo(() => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email.split('@')[0];
  }, [user.email, user.firstName, user.lastName]);

  const avatarText = useMemo(() => {
    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();

    return initials || user.email.slice(0, 1).toUpperCase();
  }, [user.email, user.firstName, user.lastName]);

  const roleLabel = useMemo(() => {
    if (user.role === UserRole.ADMIN) {
      return labels.adminBadge;
    }

    if (user.role === UserRole.CREATOR) {
      return labels.creatorBadge;
    }

    return labels.userBadge;
  }, [labels.adminBadge, labels.creatorBadge, labels.userBadge, user.role]);

  const membershipBadge = user.plan === UserPlan.PREMIUM ? labels.premiumBadge : labels.freeBadge;
  const planToneClass = user.plan === UserPlan.PREMIUM ? styles.premiumTone : styles.freeTone;
  const roleToneClass =
    user.role === UserRole.ADMIN
      ? styles.adminTone
      : user.role === UserRole.CREATOR
        ? styles.creatorTone
        : styles.userTone;
  const isStandardUser = user.role === UserRole.USER;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        type="button"
        className={styles.accountTrigger}
        onClick={() => setIsMenuOpen((previous) => !previous)}
        aria-label={labels.profile}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <span className={styles.accountAvatar}>{avatarText}</span>
      </button>

      {isMenuOpen ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownAvatar}>{avatarText}</span>
            <div className={styles.dropdownIdentity}>
              <p className={styles.dropdownName}>{displayName}</p>
              <p className={styles.dropdownEmail}>{user.email}</p>
              <div className={styles.dropdownMeta}>
                {user.role === UserRole.ADMIN ? (
                  <span className={`${styles.metaToken} ${roleToneClass}`}>{roleLabel}</span>
                ) : isStandardUser ? (
                  <span className={`${styles.metaToken} ${planToneClass}`}>{membershipBadge}</span>
                ) : (
                  <>
                    <span className={`${styles.metaToken} ${planToneClass}`}>{membershipBadge}</span>
                    <span className={styles.metaDivider}>-</span>
                    <span className={`${styles.metaToken} ${roleToneClass}`}>{roleLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.dropdownLinks}>
            {user.role === UserRole.ADMIN ? (
              <Link href="/admin" className={styles.dropdownLink} onClick={closeMenu}>
                {labels.admin}
              </Link>
            ) : null}
            {user.role !== UserRole.ADMIN ? (
              <Link href="/resources" className={styles.dropdownLink} onClick={closeMenu}>
                {labels.resources}
              </Link>
            ) : null}
            {user.role !== UserRole.ADMIN ? (
              <Link href="/certificates" className={styles.dropdownLink} onClick={closeMenu}>
                {labels.certificates}
              </Link>
            ) : null}
            <Link href="/account" className={styles.dropdownLink} onClick={closeMenu}>
              {labels.profile}
            </Link>
          </div>

          <button
            type="button"
            className={styles.dropdownLogout}
            onClick={() => {
              closeMenu();
              void logout();
            }}
          >
            {labels.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
