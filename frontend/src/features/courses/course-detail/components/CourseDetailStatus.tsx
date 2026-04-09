import styles from '../CourseDetailPage.module.css';

type CourseDetailStatusProps = {
  message: string;
};

export default function CourseDetailStatus({ message }: CourseDetailStatusProps) {
  return (
    <div className={styles.pageShell}>
      <div className={styles.layout}>
        <main className={styles.contentPanel}>
          <p className={styles.contentDescription}>{message}</p>
        </main>
      </div>
    </div>
  );
}