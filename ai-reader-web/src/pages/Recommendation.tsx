import { useState, useEffect } from "react";
import { List, Tag, Spin, Empty, message } from "antd";
import RecommendTab, { type RecommendTabKey } from "../components/Layout/RecommendTab";
import { getHotArticlesApi, type BackendArticle } from "../services";
import styles from "../styles/Recommendation.module.css";

const Recommendation = () => {
  const [activeTab, setActiveTab] = useState<RecommendTabKey>("recommend");
  const [articles, setArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await getHotArticlesApi();
        setArticles(data);
      } catch (err) {
        console.error("获取推荐文章失败:", err);
        message.error("获取推荐文章失败");
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={styles.recommendContainer}>
      <RecommendTab activeKey={activeTab} onChange={setActiveTab} />
      <div className={styles.listContainer}>
        <Spin spinning={loading}>
          {articles.length > 0 ? (
            <List
              dataSource={articles}
              pagination={false}
              renderItem={(item) => (
                <List.Item className={styles.listItem}>
                  <a
                    href={item.mobileUrl || item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.articleLink}
                  >
                    <div className={styles.articleContent}>
                      <div className={styles.articleMain}>
                        <h3 className={styles.articleTitle}>{item.title}</h3>
                        <div className={styles.articleFooter}>
                          <div className={styles.articleMeta}>
                            <span className={styles.author}>
                              {item.author || "匿名作者"}
                            </span>
                            <span className={styles.separator}>|</span>
                            <span className={styles.statItem}>
                              🔥 {formatNumber(item.hot || 0)}
                            </span>
                          </div>
                          <div className={styles.tags}>
                            <Tag>{item.source || "未知来源"}</Tag>
                            <Tag>{item.tag || "综合"}</Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </List.Item>
              )}
            />
          ) : (
            !loading && <Empty description="暂无推荐文章" />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Recommendation;
