import { Link } from "react-router-dom";
import styles from "../../styles/Home/HotList.module.css";

interface Article {
  id: number;
  title: string;
}

const mockArticles: Article[] = [
  { id: 1, title: "2026 春晚魔术大揭秘:作为..." },
  { id: 2, title: "Claude Code 已经100%自..." },
  { id: 3, title: "丰田正在使用 Flutter 开发游..." },
  { id: 4, title: "我给Mac做了一个 Windows ..." },
  { id: 5, title: "你知道不,你现在给AI用的..." },
];

const HotList = () => {
  const handleRefresh = () => {
    console.log("刷新文章热榜");
    // TODO: 实现刷新逻辑
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#ff4757"; // 红色
      case 2:
        return "#ff6348"; // 橙色
      case 3:
        return "#ffa502"; // 黄色/金色
      default:
        return "#999"; // 灰色
    }
  };

  return (
    <div className={styles.hotList}>
      <div className={styles.header}>
        <div className={styles.title}>
          <div className={styles.icon}></div>
          <span>文章榜</span>
        </div>
        <div className={styles.refresh} onClick={handleRefresh}>
          <span className={styles.refreshIcon}>↻</span>
          <span>换一换</span>
        </div>
      </div>
      <div className={styles.list}>
        {mockArticles.map((article, index) => {
          const rank = index + 1;
          return (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className={styles.item}
            >
              <span
                className={styles.rank}
                style={{ color: getRankColor(rank) }}
              >
                {rank}
              </span>
              <span className={styles.title}>{article.title}</span>
            </Link>
          );
        })}
      </div>
      <div className={styles.footer}>
        <Link to="/trending" className={styles.moreLink}>
          查看更多&gt;
        </Link>
      </div>
    </div>
  );
};

export default HotList;

