import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, List, Tag, Spin, Empty, Input, Button, message } from "antd";
import {
  getSubscribeArticlesApi,
  collectArticleApi,
  getUserProfileApi,
  type BackendArticle,
} from "../services";
import { useUserStore } from "../store/user";
import styles from "../styles/SearchResult.module.css";

const { Search } = Input;

const SearchResult = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { isLoggedIn, userInfo, setUserInfo } = useUserStore();
  const [articles, setArticles] = useState<BackendArticle[]>([]);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  useEffect(() => {
    if (userInfo?.collectedArticleIds?.length) {
      setCollectedIds(new Set(userInfo.collectedArticleIds));
    }
  }, [userInfo]);

  useEffect(() => {
    if (isLoggedIn && !userInfo) {
      getUserProfileApi().then((profile) => {
        if (profile.collectedArticleIds?.length) {
          setCollectedIds(new Set(profile.collectedArticleIds));
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  const doSearch = async (keyword: string) => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await getSubscribeArticlesApi(keyword.trim());
      setArticles(res.articles || []);
    } catch {
      message.error("搜索失败，请稍后重试");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      doSearch(query);
    }
  }, [query]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    }
  };

  const handleCollect = async (e: React.MouseEvent, article: BackendArticle) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      message.warning("请先登录");
      return;
    }
    if (collectedIds.has(article.id)) return;
    try {
      const res = await collectArticleApi(article.id);
      const newIds = new Set(res.collectedArticleIds);
      setCollectedIds(newIds);
      if (userInfo) {
        setUserInfo({ ...userInfo, collectedArticleIds: res.collectedArticleIds });
      }
      message.success("已收藏");
    } catch {
      message.error("收藏失败");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <Search
          defaultValue={query}
          placeholder="搜索文章..."
          allowClear
          enterButton="搜索"
          size="large"
          onSearch={handleSearch}
          className={styles.searchInput}
        />
      </div>

      <Card bordered={false} className={styles.card}>
        {query && (
          <div className={styles.resultHeader}>
            {loading ? "搜索中..." : `"${query}" 的搜索结果，共 ${articles.length} 篇`}
          </div>
        )}
        <Spin spinning={loading}>
          {articles.length > 0 ? (
            <List
              dataSource={articles}
              renderItem={(item) => (
                <List.Item className={styles.listItem}>
                  <a
                    href={item.mobileUrl || item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.articleLink}
                  >
                    <div className={styles.articleContent}>
                      <div className={styles.titleRow}>
                        <h4 className={styles.articleTitle}>{item.title}</h4>
                        {collectedIds.has(item.id) ? (
                          <span className={styles.collectedText}>已收藏</span>
                        ) : (
                          <Button
                            type="text"
                            size="small"
                            className={styles.collectBtn}
                            onClick={(e) => handleCollect(e, item)}
                          >
                            + 收藏
                          </Button>
                        )}
                      </div>
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
            !loading && searched && <Empty description={`未找到与 "${query}" 相关的文章`} />
          )}
          {!searched && !loading && (
            <Empty description="输入关键词开始搜索" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SearchResult;
