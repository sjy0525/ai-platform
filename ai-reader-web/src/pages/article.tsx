import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tag, Spin, Button, message, Empty } from "antd";
import {
  getArticleApi,
  getArticleContentApi,
  collectArticleApi,
  uncollectArticleApi,
  type BackendArticle,
} from "../services";
import { useUserStore } from "../store/user";
import AiAssistant from "../components/AiAssistant";
import styles from "../styles/Article.module.css";

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, setUserInfo } = useUserStore();

  const [article, setArticle] = useState<BackendArticle | null>(null);
  const [content, setContent] = useState<string>("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const isCollected = !!(userInfo?.collectedArticleIds?.includes(id || ""));

  useEffect(() => {
    if (!id) return;
    setLoadingMeta(true);
    setLoadingContent(true);
    setNotFound(false);

    getArticleApi(id)
      .then((data) => setArticle(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoadingMeta(false));

    getArticleContentApi(id)
      .then((res) => setContent(res.content || ""))
      .catch(() => setContent(""))
      .finally(() => setLoadingContent(false));
  }, [id]);

  const handleCollect = async () => {
    if (!isLoggedIn) { message.warning("请先登录"); return; }
    if (!id) return;
    setCollecting(true);
    try {
      if (isCollected) {
        const res = await uncollectArticleApi(id);
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已取消收藏");
      } else {
        const res = await collectArticleApi(id);
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已收藏");
      }
    } catch {
      message.error(isCollected ? "取消收藏失败" : "收藏失败");
    } finally {
      setCollecting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.loadingWrap}>
          <Spin spinning tip="加载中..." />
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.loadingWrap}>
          <Empty description="文章不存在">
            <Button type="primary" onClick={() => navigate(-1)}>返回上一页</Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      {/* 左侧：AI 助手 */}
      <div className={styles.aiPanel}>
        <AiAssistant articleId={id!} />
      </div>

      {/* 右侧：文章正文 */}
      <div className={styles.articlePanel}>
        <Card className={styles.articleCard}>
          <div className={styles.backRow}>
            <Button type="link" className={styles.backLink} onClick={() => navigate(-1)}>
              ← 返回
            </Button>
            <div className={styles.actions}>
              {article.url && (
                <a href={article.url} target="_blank" rel="noreferrer">
                  <Button type="default" size="small">查看原文</Button>
                </a>
              )}
              {isLoggedIn && (
                <Button
                  type={isCollected ? "default" : "primary"}
                  size="small"
                  loading={collecting}
                  onClick={handleCollect}
                  style={isCollected ? { color: "#52c41a", borderColor: "#52c41a" } : undefined}
                >
                  {isCollected ? "已收藏" : "+ 收藏"}
                </Button>
              )}
            </div>
          </div>

          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>{article.author || "匿名作者"}</span>
            <span className={styles.separator}>|</span>
            <span>{article.source}</span>
            <span className={styles.separator}>|</span>
            <span>🔥 {article.hot || 0}</span>
          </div>
          <div className={styles.tags}>
            <Tag>{article.tag || "综合"}</Tag>
          </div>

          <div className={styles.divider} />

          {loadingContent ? (
            <Spin spinning tip="正在加载文章内容..." />
          ) : content ? (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className={styles.noContent}>
              <p>无法自动获取文章内容，请</p>
              <a href={article.url} target="_blank" rel="noreferrer">点击查看原文</a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Article;
