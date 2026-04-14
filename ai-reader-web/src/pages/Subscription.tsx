import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, List, Tag, Empty, message, Spin, Button, Collapse } from "antd";
import {
  getColumnArticlesApi,
  unsubscribeColumnApi,
  getUserProfileApi,
  collectArticleApi,
  uncollectArticleApi,
  type BackendArticle,
  type TechColumn,
} from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Subscription.module.css";

const { Panel } = Collapse;

const Subscription = () => {
  const { userInfo, isLoggedIn, setUserInfo } = useUserStore();
  const navigate = useNavigate();
  const [subscribedColumns, setSubscribedColumns] = useState<TechColumn[]>([]);
  const [columnArticles, setColumnArticles] = useState<Record<string, BackendArticle[]>>({});
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [pageLoading, setPageLoading] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  useEffect(() => {
    setCollectedIds(new Set(userInfo?.collectedArticleIds || []));
  }, [userInfo]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      setPageLoading(true);
      try {
        const profile = await getUserProfileApi();
        setSubscribedColumns(profile.subscribedColumns || []);
        setCollectedIds(new Set(profile.collectedArticleIds || []));
      } catch {
        message.error("获取订阅专栏失败");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

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

  const loadColumnArticles = async (columnId: string) => {
    if (columnArticles[columnId]) return;
    setLoadingColumns((prev) => new Set(prev).add(columnId));
    try {
      const articles = await getColumnArticlesApi(columnId);
      setColumnArticles((prev) => ({ ...prev, [columnId]: articles }));
    } catch {
      message.error("获取专栏文章失败");
    } finally {
      setLoadingColumns((prev) => {
        const next = new Set(prev);
        next.delete(columnId);
        return next;
      });
    }
  };

  const handleUnsubscribe = async (columnId: string) => {
    try {
      const res = await unsubscribeColumnApi(columnId);
      setSubscribedColumns((prev) => prev.filter((c) => c.id !== columnId));
      if (userInfo) {
        setUserInfo({ ...userInfo, subscribedColumnIds: res.subscribedColumnIds });
      }
      message.success("已取消订阅");
    } catch {
      message.error("取消订阅失败");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <Card className={styles.articleCard}>
          <Empty description="请先登录查看订阅">
            <Link to="/login"><Button type="primary">去登录</Button></Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionContainer}>
      <Spin spinning={pageLoading}>
        {subscribedColumns.length === 0 && !pageLoading ? (
          <Card className={styles.articleCard}>
            <Empty description="暂无订阅专栏">
              <Link to="/search?q=前端">
                <Button type="primary">去搜索专栏</Button>
              </Link>
            </Empty>
          </Card>
        ) : (
          <Collapse
            defaultActiveKey={[]}
            onChange={(keys) => {
              const key = Array.isArray(keys) ? keys[keys.length - 1] : keys;
              if (key) loadColumnArticles(key as string);
            }}
            className={styles.collapse}
          >
            {subscribedColumns.map((col) => (
              <Panel
                key={col.id}
                header={
                  <div className={styles.panelHeader}>
                    <div>
                      <span className={styles.columnName}>{col.name}</span>
                      <span className={styles.columnDesc}>{col.description}</span>
                    </div>
                    <Button
                      size="small"
                      danger
                      type="text"
                      onClick={(e) => { e.stopPropagation(); handleUnsubscribe(col.id); }}
                    >
                      取消订阅
                    </Button>
                  </div>
                }
              >
                <Spin spinning={loadingColumns.has(col.id)}>
                  {columnArticles[col.id]?.length > 0 ? (
                    <List
                      dataSource={columnArticles[col.id]}
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
                            <div className={styles.articleItem}>
                              <h4 className={styles.articleTitle}>{item.title}</h4>
                              <div className={styles.articleMeta}>
                                <span>{item.author || "匿名作者"}</span>
                                <span>🔥 {formatNumber(item.hot || 0)}</span>
                              </div>
                              <div className={styles.tags}>
                                <Tag>{item.tag || "综合"}</Tag>
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    !loadingColumns.has(col.id) && <Empty description="暂无相关文章" />
                  )}
                </Spin>
              </Panel>
            ))}
          </Collapse>
        )}
      </Spin>
    </div>
  );
};

export default Subscription;
