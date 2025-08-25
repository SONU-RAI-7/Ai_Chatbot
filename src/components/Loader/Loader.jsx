import styles from "./Loader.module.css";

export function Loader() {
  return (
    <div className={styles.LoaderWrapper}>
      <div className={styles.Loader}>
        <div></div>
      </div>
    </div>
  );
}
