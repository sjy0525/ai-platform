import { useState, useEffect } from "react";
import { List, Tag, Spin, Empty, message, Button } from "antd";
import { useNavigate } from "react-router-dom";
import RecommendTab, { type RecommendTabKey } from "../components/Layout/RecommendTab";
import { getHotArticlesApi, collectArticleApi, uncollectArticleApi, type BackendArticle } from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Recommendation.module.css";

const Recommendation = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, setUserInfo } = useUserStore();
  const [activeTab, setActiveTab] = useState<RecommendTabKey>("recommend");
  const [articles, setArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCollectedIds(new Set(userInfo?.collectedArticleIds || []));
  }, [userInfo]);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const sort = activeTab === "latest" ? "latest" : undefined;
        const data = await getHotArticlesApi({ sort });
        setArticles(data);
      } catch (err) {
        console.error("获取推荐文章失败:", err);
        message.error("获取推荐文章失败");
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [activeTab]);

  const handleCollect = async (e: React.MouseEvent, article: BackendArticle) => {
    e.stopPropagation();
    if (!isLoggedIn) { message.warning("请先登录"); return; }
    try {
      if (collectedIds.has(article.id)) {
        const res = await uncollectArticleApi(article.id);
        setCollectedIds(new Set(res.collectedArticleIds));
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已取消收藏");
      } else {
        const res = await collectArticleApi(article.id);
        setCollectedIds(new Set(res.collectedArticleIds));
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已收藏");
      }
    } catch {
      message.error("操作失败");
    }
  };

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
                <List.Item
                  className={styles.listItem}
                  actions={[
                    <Button
                      key="collect"
                      type="text"
                      size="small"
                      style={collectedIds.has(item.id) ? { color: "#52c41a" } : undefined}
                      onClick={(e) => handleCollect(e, item)}
                    >
                      {collectedIds.has(item.id) ? "已收藏" : "+ 收藏"}
                    </Button>,
                  ]}
                >
                  <div
                    className={styles.articleLink}
                    onClick={() => navigate(`/article/${encodeURIComponent(item.id)}`)}
                    style={{ cursor: "pointer", flex: 1 }}
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
                            <Tag>{item.tag || "综合"}</Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
