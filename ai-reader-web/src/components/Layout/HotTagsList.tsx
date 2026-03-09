import { useNavigate } from "react-router-dom";
import { Card } from "antd";
import { allTags } from "../../data/mockArticles";
import styles from "../../styles/Home/HotTagsList.module.css";

const HotTagsList = () => {
  const navigate = useNavigate();

  return (
    <Card title="热门标签" bordered={false} className={styles.card}>
      <div className={styles.tagList}>
        {allTags.map((tag) => (
          <div
            key={tag}
            className={styles.tagItem}
            onClick={() => navigate(`/trending?tag=${encodeURIComponent(tag)}`)}
          >
            {tag}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default HotTagsList;
