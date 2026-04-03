import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, List, Tag, Empty, message, Spin, Button, Collapse } from "antd";
import {
  getColumnArticlesApi,
  unsubscribeColumnApi,
  getUserProfileApi,
  type BackendArticle,
  type TechColumn,
} from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/Subscription.module.css";

const { Panel } = Collapse;

const Subscription = () => {
  const { userInfo, isLoggedIn, setUserInfo } = useUserStore();
  const [subscribedColumns, setSubscribedColumns] = useState<TechColumn[]>([]);
  const [columnArticles, setColumnArticles] = useState<Record<string, BackendArticle[]>>({});
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [pageLoading, setPageLoading] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      setPageLoading(true);
      try {
        const profile = await getUserProfileApi();
        setSubscribedColumns(profile.subscribedColumns || []);
      } catch {
        message.error("获取订阅专栏失败");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

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
                        <List.Item className={styles.listItem}>
                          <a
                            href={item.mobileUrl || item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.articleLink}
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
                          </a>
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
