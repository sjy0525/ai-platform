import styles from "../../styles/Home/RecommendTab.module.css";

export type RecommendTabKey = "recommend" | "latest";

interface RecommendTabProps {
  activeKey: RecommendTabKey;
  onChange: (key: RecommendTabKey) => void;
}

const RecommendTab = ({ activeKey, onChange }: RecommendTabProps) => {
  return (
    <div className={styles.tabs}>
      <div
        className={`${styles.tab} ${activeKey === "recommend" ? styles.active : ""}`}
        onClick={() => onChange("recommend")}
      >
        推荐
      </div>
      <div
        className={`${styles.tab} ${activeKey === "latest" ? styles.active : ""}`}
        onClick={() => onChange("latest")}
      >
        最新
      </div>
    </div>
  );
};

export default RecommendTab;
