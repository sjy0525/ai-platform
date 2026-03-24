import { useState } from "react";
import { Select, Card, List, Tag, Empty, message, Spin, Button } from "antd";
import { getSubscribeArticlesApi, type BackendArticle } from "../services";
import styles from "../styles/Subscription.module.css";

const recommendedTags = [
  "前端",
  "后端",
  "面试",
  "JavaScript",
  "AI编程",
  "Cursor",
  "AIGC",
  "架构",
  "Android",
  "程序员",
];

const Subscription = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchedArticles, setMatchedArticles] = useState<BackendArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribedArticleIds, setSubscribedArticleIds] = useState<string[]>([]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  const fetchMatchingArticles = async (tags: string[]) => {
    if (tags.length === 0) {
      setMatchedArticles([]);
      return;
    }

    const keyword = tags[0];
    if (tags.length > 1) {
      message.info("当前最小版本仅按第一个标签匹配订阅文章");
    }

    try {
      setLoading(true);
      const res = await getSubscribeArticlesApi(keyword);
      setMatchedArticles(res.articles || []);
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

  const getArticleSummary = (article: BackendArticle): string => {
    const source = article.source || "未知来源";
    const tag = article.tag || "综合";
    return `${source} · ${tag}`;
  };

  const hasSelectedTags = selectedTags.length > 0;

  const emptyText = hasSelectedTags
    ? "暂无匹配的文章（请确认已登录且后端有可用数据）"
    : "请先选择感兴趣的标签";

  const getArticleLink = (article: BackendArticle): string => {
    return article.mobileUrl || article.url || "#";
  };

  const getArticleHot = (article: BackendArticle): number => {
    return article.hot || 0;
  };

  const getArticleAuthor = (article: BackendArticle): string => {
    return article.author || "匿名作者";
  };

  const getArticleTag = (article: BackendArticle): string => {
    return article.tag || "综合";
  };

  const getArticleSource = (article: BackendArticle): string => {
    return article.source || "未知来源";
  };

  const getArticleTitle = (article: BackendArticle): string => {
    return article.title || "无标题";
  };

  const getArticleId = (article: BackendArticle): string => {
    return article.id || Math.random().toString(36).slice(2);
  };

  const getArticleList = () => {
    if (selectedTags.length === 0) return [];
    return matchedArticles.slice(0, 3);
  };

  const handleSubscribeByArticle = (article: BackendArticle) => {
    const articleId = getArticleId(article);
    if (subscribedArticleIds.includes(articleId)) {
      message.info("已订阅");
      return;
    }
    setSubscribedArticleIds((prev) => [...prev, articleId]);
    message.success("已订阅");
  };

  const displayArticles = getArticleList();

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
        </Card>
      </div>
      <div className={styles.rightPanel}>
        <Card
          title={`匹配的文章 (最多3篇)`}
          bordered={false}
          className={styles.articleCard}
        >
          <Spin spinning={loading}>
            {displayArticles.length > 0 ? (
              <List
                dataSource={displayArticles}
                renderItem={(item) => (
                  <List.Item>
                    <a
                      href={getArticleLink(item)}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.articleLink}
                    >
                      <div className={styles.articleItem}>
                        <div className={styles.titleRow}>
                          <h4 className={styles.articleTitle}>{getArticleTitle(item)}</h4>
                          {subscribedArticleIds.includes(getArticleId(item)) ? (
                            <span className={styles.subscribedText}>已订阅</span>
                          ) : (
                            <Button
                              type="text"
                              shape="circle"
                              className={styles.subscribePlus}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleSubscribeByArticle(item);
                              }}
                            >
                              +
                            </Button>
                          )}
                        </div>
                        <p className={styles.articleExcerpt}>{getArticleSummary(item)}</p>
                        <div className={styles.articleMeta}>
                          <span>{getArticleAuthor(item)}</span>
                          <span>🔥 {formatNumber(getArticleHot(item))}</span>
                        </div>
                        <div className={styles.tags}>
                          <Tag key={`${getArticleId(item)}-source`}>
                            {getArticleSource(item)}
                          </Tag>
                          <Tag key={`${getArticleId(item)}-tag`}>{getArticleTag(item)}</Tag>
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
