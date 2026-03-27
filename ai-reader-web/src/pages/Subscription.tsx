import { useState, useEffect } from "react";
import { Select, Card, List, Tag, Empty, message, Spin, Button } from "antd";
import {
  getSubscribeArticlesApi,
  updateKeywordsApi,
  collectArticleApi,
  type BackendArticle,
} from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Subscription.module.css";

const recommendedTags = [
  "前端",
  "后端",
  "面试",
  "AI编程",
  "架构",
  "Android",
];

const Subscription = () => {
  const { userInfo, isLoggedIn, setUserInfo } = useUserStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchedArticles, setMatchedArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKeywords, setSavingKeywords] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userInfo?.subscribedKeywords?.length) {
      setSelectedTags(userInfo.subscribedKeywords);
    }
    if (userInfo?.collectedArticleIds?.length) {
      setCollectedIds(new Set(userInfo.collectedArticleIds));
    }
  }, [userInfo]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  const fetchMatchingArticles = async (tags: string[]) => {
    if (tags.length === 0) {
      setMatchedArticles([]);
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.all(
        tags.map((tag) => getSubscribeArticlesApi(tag))
      );
      const seen = new Set<string>();
      const merged: BackendArticle[] = [];
      for (const res of results) {
        for (const article of res.articles || []) {
          if (!seen.has(article.id)) {
            seen.add(article.id);
            merged.push(article);
          }
        }
      }
      setMatchedArticles(merged);
    } catch (error) {
      console.error("获取订阅文章失败:", error);
      message.error("获取订阅文章失败，请先确认已登录");
      setMatchedArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const onTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    void fetchMatchingArticles(tags);
  };

  const handleSaveKeywords = async () => {
    if (!isLoggedIn) {
      message.warning("请先登录");
      return;
    }
    try {
      setSavingKeywords(true);
      await updateKeywordsApi(selectedTags);
      if (userInfo) {
        setUserInfo({ ...userInfo, subscribedKeywords: selectedTags });
      }
      message.success("订阅已保存");
    } catch {
      message.error("保存订阅失败");
    } finally {
      setSavingKeywords(false);
    }
  };

  const handleCollect = async (article: BackendArticle) => {
    if (!isLoggedIn) {
      message.warning("请先登录");
      return;
    }
    if (collectedIds.has(article.id)) {
      message.info("已收藏");
      return;
    }
    try {
      const res = await collectArticleApi(article.id);
      setCollectedIds(new Set(res.collectedArticleIds));
      if (userInfo) {
        setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
      }
      message.success("已收藏");
    } catch {
      message.error("收藏失败");
    }
  };

  const hasSelectedTags = selectedTags.length > 0;
  const emptyText = hasSelectedTags
    ? "暂无匹配的文章（请确认已登录且后端有可用数据）"
    : "请先选择感兴趣的标签";

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <Card title="感兴趣的标签" bordered={false} className={styles.tagCard}>
          <Select
            mode="tags"
            placeholder="输入或选择标签，按回车添加"
            value={selectedTags}
            onChange={onTagsChange}
            style={{ width: "100%" }}
            options={recommendedTags.map((tag) => ({ value: tag, label: tag }))}
            tokenSeparators={[","]}
          />
          <Button
            type="primary"
            block
            style={{ marginTop: 12 }}
            onClick={handleSaveKeywords}
            loading={savingKeywords}
            disabled={selectedTags.length === 0}
          >
            保存订阅
          </Button>
        </Card>
      </div>
      <div className={styles.rightPanel}>
        <Card
          title="匹配的文章"
          bordered={false}
          className={styles.articleCard}
        >
          <Spin spinning={loading}>
            {matchedArticles.length > 0 ? (
              <List
                dataSource={matchedArticles}
                renderItem={(item) => (
                  <List.Item>
                    <a
                      href={item.mobileUrl || item.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.articleLink}
                    >
                      <div className={styles.articleItem}>
                        <div className={styles.titleRow}>
                          <h4 className={styles.articleTitle}>
                            {item.title || "无标题"}
                          </h4>
                          {collectedIds.has(item.id) ? (
                            <span className={styles.subscribedText}>已收藏</span>
                          ) : (
                            <Button
                              type="text"
                              shape="circle"
                              className={styles.subscribePlus}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleCollect(item);
                              }}
                            >
                              +
                            </Button>
                          )}
                        </div>
                        <div className={styles.articleMeta}>
                          <span>{item.author || "匿名作者"}</span>
                          <span>🔥 {formatNumber(item.hot || 0)}</span>
                        </div>
                        <div className={styles.tags}>
                          <Tag>{item.tag || "综合"}</Tag>
                        </div>
                      </div>
                    </a>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={emptyText} />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
