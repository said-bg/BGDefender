import styles from './PasswordRequirements.module.css';

type PasswordRequirementsProps = {
  password: string;
  requirement1: string;
  requirement2: string;
  requirement3: string;
};

const checks = (password: string) => [
  { key: 'length', isValid: password.length >= 8 },
  { key: 'uppercase', isValid: /[A-Z]/.test(password) },
  { key: 'number', isValid: /[0-9]/.test(password) },
];

export default function PasswordRequirements({
  password,
  requirement1,
  requirement2,
  requirement3,
}: PasswordRequirementsProps) {
  const labels = {
    length: requirement1,
    uppercase: requirement2,
    number: requirement3,
  };

  if (!password) {
    return null;
  }

  return (
    <div className={styles.passwordInfo}>
      {checks(password).map((requirement) => (
        <div key={requirement.key} className={styles.passwordRequirement}>
          <span
            className={`${styles.requirementIcon} ${
              requirement.isValid
                ? styles.requirementIconValid
                : styles.requirementIconInvalid
            }`}
          >
            {requirement.isValid ? 'OK' : 'x'}
          </span>
          <span
            className={`${styles.requirementText} ${
              requirement.isValid
                ? styles.requirementTextValid
                : styles.requirementTextInvalid
            }`}
          >
            {labels[requirement.key as keyof typeof labels]}
          </span>
        </div>
      ))}
    </div>
  );
}
