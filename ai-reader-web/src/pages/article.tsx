import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Skeleton, Tag, message } from "antd";
import {
  getArticleContentApi,
  getArticleByIdApi,
  collectArticleApi,
  uncollectArticleApi,
  type BackendArticle,
} from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Article.module.css";

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, setUserInfo } = useUserStore();

  const [article, setArticle] = useState<BackendArticle | null>(null);
  const [html, setHtml] = useState("");
  const [contentLoading, setContentLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [collected, setCollected] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getArticleByIdApi(id)
      .then((a) => {
        setArticle(a);
        setCollected(userInfo?.collectedArticleIds?.includes(a.id) ?? false);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setContentLoading(true);
    setFetchFailed(false);
    getArticleContentApi(id)
      .then((res) => {
        if (res.success && res.html) {
          setHtml(res.html);
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => setFetchFailed(true))
      .finally(() => setContentLoading(false));
  }, [id]);

  // 收藏状态跟随 userInfo 同步
  useEffect(() => {
    if (article && userInfo?.collectedArticleIds) {
      setCollected(userInfo.collectedArticleIds.includes(article.id));
    }
  }, [userInfo, article]);

  const handleCollect = async () => {
    if (!isLoggedIn) { message.warning("请先登录"); return; }
    if (!article) return;
    setCollectLoading(true);
    try {
      if (collected) {
        const res = await uncollectArticleApi(article.id);
        setCollected(false);
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已取消收藏");
      } else {
        const res = await collectArticleApi(article.id);
        setCollected(true);
        if (userInfo) setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
        message.success("已收藏");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setCollectLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <Button type="text" onClick={() => navigate(-1)} className={styles.backBtn}>
          ← 返回
        </Button>
        <div className={styles.toolbarRight}>
          {article && (
            <Button
              type={collected ? "default" : "primary"}
              loading={collectLoading}
              onClick={handleCollect}
              className={collected ? styles.collectedBtn : ""}
            >
              {collected ? "✓ 已收藏" : "+ 收藏"}
            </Button>
          )}
          {article && (
            <Button
              type="link"
              href={article.mobileUrl || article.url}
              target="_blank"
              rel="noreferrer"
            >
              查看原文 ↗
            </Button>
          )}
        </div>
      </div>

      {/* 文章头部 */}
      {article ? (
        <div className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>{article.author || "匿名作者"}</span>
            <span className={styles.separator}>·</span>
            <span>🔥 {article.hot?.toLocaleString()}</span>
            <span className={styles.separator}>·</span>
            <Tag>{article.tag || "综合"}</Tag>
          </div>
        </div>
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} className={styles.headerSkeleton} />
      )}

      <div className={styles.divider} />

      {/* 正文 */}
      {contentLoading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : fetchFailed ? (
        <div className={styles.fallback}>
          <p>当前页面内容无法直接加载（可能需要登录或使用了动态渲染）</p>
          {article && (
            <Button
              type="primary"
              href={article.mobileUrl || article.url}
              target="_blank"
              rel="noreferrer"
            >
              前往原文阅读 ↗
            </Button>
          )}
        </div>
      ) : (
        <div
          ref={contentRef}
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};

export default Article;
