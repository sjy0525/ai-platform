import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getHotArticlesApi, type BackendArticle } from "../../services";
import styles from "../../styles/Home/HotList.module.css";

const HotList = () => {
  const [allArticles, setAllArticles] = useState<BackendArticle[]>([]);
  const [displayOffset, setDisplayOffset] = useState(0);

  useEffect(() => {
    getHotArticlesApi()
      .then((data) => setAllArticles(data))
      .catch((err) => console.error("获取热榜失败:", err));
  }, []);

  const displayArticles = allArticles.slice(displayOffset, displayOffset + 5);

  const handleRefresh = () => {
    if (allArticles.length <= 5) return;
    const maxOffset = allArticles.length - 5;
    setDisplayOffset(Math.floor(Math.random() * maxOffset));
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#ff4757";
      case 2:
        return "#ff6348";
      case 3:
        return "#ffa502";
      default:
        return "#999";
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
        {displayArticles.map((article, index) => {
          const rank = index + 1;
          return (
            <Link
              key={article.id}
              to={`/article/${encodeURIComponent(article.id)}`}
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
