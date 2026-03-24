import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, List, Tag, Spin, Empty, message } from "antd";
import { getHotArticlesApi, type BackendArticle } from "../services";
import styles from "../styles/Trending.module.css";

const techStacks = ["全部", "前端", "后端", "AI编程", "Android", "架构", "面试"];

const Trending = () => {
  const [searchParams] = useSearchParams();
  const tagFromUrl = searchParams.get("tag");
  const [selectedTag, setSelectedTag] = useState<string>(
    tagFromUrl && techStacks.includes(tagFromUrl)
      ? tagFromUrl
      : techStacks[0]
  );
  const [articles, setArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tagFromUrl && techStacks.includes(tagFromUrl)) {
      setSelectedTag(tagFromUrl);
    }
  }, [tagFromUrl]);

  useEffect(() => {
    const fetchHotArticles = async () => {
      try {
        setLoading(true);
        const params = selectedTag === "全部" ? undefined : { tag: selectedTag };
        const res = await getHotArticlesApi(params);
        setArticles(res);
      } catch (error) {
        console.error("获取热榜失败:", error);
        message.error("获取热榜失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchHotArticles();
  }, [selectedTag]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#ff4757";
    if (rank === 2) return "#ff6348";
    if (rank === 3) return "#ffa502";
    return "#999";
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <Card title="技术栈" bordered={false} className={styles.tagCard}>
          <div className={styles.tagList}>
            {techStacks.map((tag) => (
              <div
                key={tag}
                className={`${styles.tagItem} ${selectedTag === tag ? styles.active : ""}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className={styles.rightPanel}>
        <Card
          title={`${selectedTag} 热榜`}
          bordered={false}
          className={styles.articleCard}
        >
          <Spin spinning={loading}>
            {articles.length > 0 ? (
              <List
                dataSource={articles}
                renderItem={(item, index) => {
                  const rank = index + 1;
                  const articleUrl = item.mobileUrl || item.url;
                  return (
                    <List.Item key={`${item.id}-${index}`} className={styles.listItem}>
                      <a
                        href={articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.articleLink}
                      >
                        <div className={styles.articleItem}>
                          <span
                            className={styles.rank}
                            style={{ color: getRankColor(rank) }}
                          >
                            {rank}
                          </span>
                          <div className={styles.articleContent}>
                            <h4 className={styles.articleTitle}>{item.title}</h4>
                            <div className={styles.articleMeta}>
                              <span>{item.author || "匿名作者"}</span>
                              <span>🔥 {formatNumber(item.hot || 0)}</span>
                            </div>
                            <div className={styles.tags}>
                              <Tag>{item.source || "未知来源"}</Tag>
                              <Tag>{item.tag || "综合"}</Tag>
                            </div>
                          </div>
                        </div>
                      </a>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无热榜数据" />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default Trending;
