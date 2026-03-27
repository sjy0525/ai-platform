import { useState, useEffect } from "react";
import { List, Tag, Card, Spin, Empty, Button, message } from "antd";
import { Link } from "react-router-dom";
import { getUserProfileApi, uncollectArticleApi, type BackendArticle } from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Favorite.module.css";

const Favorite = () => {
  const { isLoggedIn } = useUserStore();
  const [collectedArticles, setCollectedArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchCollected = async () => {
      setLoading(true);
      try {
        const profile = await getUserProfileApi();
        setCollectedArticles(profile.collectedArticles || []);
      } catch (err) {
        console.error("获取收藏列表失败:", err);
        message.error("获取收藏列表失败");
      } finally {
        setLoading(false);
      }
    };
    fetchCollected();
  }, [isLoggedIn]);

  const handleUncollect = async (articleId: string) => {
    try {
      await uncollectArticleApi(articleId);
      setCollectedArticles((prev) => prev.filter((a) => a.id !== articleId));
      message.success("已取消收藏");
    } catch {
      message.error("取消收藏失败");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <Card bordered={false} className={styles.card}>
          <Empty description="请先登录查看收藏">
            <Link to="/login">
              <Button type="primary">去登录</Button>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card title="我的收藏" bordered={false} className={styles.card}>
        <Spin spinning={loading}>
          {collectedArticles.length > 0 ? (
            <List
              dataSource={collectedArticles}
              renderItem={(item) => (
                <List.Item
                  className={styles.listItem}
                  actions={[
                    <Button
                      key="uncollect"
                      type="link"
                      danger
                      onClick={() => handleUncollect(item.id)}
                    >
                      取消收藏
                    </Button>,
                  ]}
                >
                  <a
                    href={item.mobileUrl || item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.articleLink}
                  >
                    <div className={styles.articleContent}>
                      <h4 className={styles.articleTitle}>{item.title}</h4>
                      <div className={styles.articleFooter}>
                        <div className={styles.articleMeta}>
                          <span>{item.author || "匿名作者"}</span>
                          <span>🔥 {formatNumber(item.hot || 0)}</span>
                        </div>
                        <div className={styles.tags}>
                          <Tag>{item.tag || "综合"}</Tag>
                        </div>
                      </div>
                    </div>
                  </a>
                </List.Item>
              )}
            />
          ) : (
            !loading && <Empty description="暂无收藏文章" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Favorite;
