import { useParams, Link } from "react-router-dom";
import { Card, Tag, Button } from "antd";
import { mockArticles } from "../data/mockArticles";
import styles from "../styles/Article.module.css";

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const articleId = id ? parseInt(id, 10) : NaN;
  let article = mockArticles.find((a) => a.id === articleId);
  if (!article && !isNaN(articleId)) {
    const index = (articleId - 1) % mockArticles.length;
    article = mockArticles[index >= 0 ? index : 0];
  }

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}k`;
    return num.toString();
  };

  if (!article) {
    return (
      <div className={styles.container}>
        <Card>
          <div className={styles.notFound}>
            <p>文章不存在</p>
            <Link to="/">
              <Button type="primary">返回首页</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const content = article.content || article.excerpt;

  return (
    <div className={styles.container}>
      <Card className={styles.articleCard}>
        <Link to="/" className={styles.backLink}>
          <Button type="link">← 返回首页</Button>
        </Link>
        <h1 className={styles.title}>{article.title}</h1>
        <div className={styles.meta}>
          <span className={styles.author}>{article.author}</span>
          <span className={styles.separator}>|</span>
          <span>👁 {formatNumber(article.views)}</span>
          <span>👍 {formatNumber(article.likes)}</span>
          <span>⭐ {formatNumber(article.favorites)}</span>
        </div>
        <div className={styles.tags}>
          {article.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        <div className={styles.content}>
          {content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Article;
