import { Link } from "react-router-dom";
import { Card, Button } from "antd";
import styles from "../styles/Article.module.css";

const Article = () => {
  return (
    <div className={styles.container}>
      <Card className={styles.articleCard}>
        <Link to="/">
          <Button type="link">← 返回首页</Button>
        </Link>
        <div className={styles.notFound}>
          <p>文章内容由第三方平台提供，请通过文章列表中的链接直接访问原文。</p>
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Article;
