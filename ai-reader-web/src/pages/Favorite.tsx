import { useState } from "react";
import { Tabs, List, Tag, Card } from "antd";
import { Link } from "react-router-dom";
import {
  likedArticles,
  favoritedArticles,
  type Article,
} from "../data/mockArticles";
import styles from "../styles/Favorite.module.css";

const Favorite = () => {
  const [activeTab, setActiveTab] = useState<string>("likes");

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  const renderArticleList = (articles: Article[]) => (
    <List
      dataSource={articles}
      renderItem={(item) => (
        <List.Item className={styles.listItem}>
          <Link to={`/article/${item.id}`} className={styles.articleLink}>
            <div className={styles.articleContent}>
              <h4 className={styles.articleTitle}>{item.title}</h4>
              <p className={styles.articleExcerpt}>{item.excerpt}</p>
              <div className={styles.articleFooter}>
                <div className={styles.articleMeta}>
                  <span>{item.author}</span>
                  <span>👁 {formatNumber(item.views)}</span>
                  <span>👍 {formatNumber(item.likes)}</span>
                  <span>⭐ {formatNumber(item.favorites)}</span>
                </div>
                <div className={styles.tags}>
                  {item.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </List.Item>
      )}
    />
  );

  const tabItems = [
    {
      key: "likes",
      label: "点赞",
      children: renderArticleList(likedArticles),
    },
    {
      key: "favorites",
      label: "收藏",
      children: renderArticleList(favoritedArticles),
    },
  ];

  return (
    <div className={styles.container}>
      <Card bordered={false} className={styles.card}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default Favorite;
