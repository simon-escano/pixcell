import { LoadingSpinner } from "@/components/loading-spinner"
import styles from "./Loading.module.css";

export function LiveblocksLoading() {
  return (
    <div className={styles.loading}>
      <LoadingSpinner />
    </div>
  )
}
