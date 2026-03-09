import { useState } from "react";
import { Link } from "react-router-dom";
import { List, Tag } from "antd";
import RecommendTab, { type RecommendTabKey } from "../components/Layout/RecommendTab";
import styles from "../styles/Recommendation.module.css";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  views: number;
  likes: number;
  favorites: number;
  tags: string[];
}

const mockArticles: Article[] = [
  {
    id: 1,
    title: "0.1加0.2为什么不等于0.3-答不上来的都挂了",
    excerpt: "0.1+0.2为什么不等于0.3?答不上来的都挂了这个问题你可能在面试、线上Bug、甚至随...",
    author: "也无风雨也雾晴",
    views: 3500,
    likes: 51,
    favorites: 12,
    tags: ["前端", "面试", "JavaScript"],
  },
  {
    id: 2,
    title: "AI 只会淘汰不用AI的程序员 🥚",
    excerpt: "作为程序员,你竟然还在手撸代码???如果没有公司给你提供账号,你真能玩转AI???...",
    author: "Karl_wei",
    views: 13000,
    likes: 131,
    favorites: 28,
    tags: ["AI编程", "Cursor", "AIGC"],
  },
  {
    id: 3,
    title: "努力工作,你已经是很了不起的成年人了",
    excerpt: "有人23岁全款小米SU7U,有人靠副业一年赚200万,别再被他们PUA了,放过自己吧。你是...",
    author: "摸鱼的春哥",
    views: 48000,
    likes: 758,
    favorites: 156,
    tags: ["前端"],
  },
  {
    id: 4,
    title: "阿里人的2025年终总结:买房、晋升、订婚、投资,遇见更清晰的自己",
    excerpt: "复盘,从来不只是回看已经发生的事情,更重要的是———————为尚未发生的未来,提前铺路、校准...",
    author: "爱敲代码的小黄",
    views: 5400,
    likes: 74,
    favorites: 19,
    tags: ["后端", "面试", "架构"],
  },
  {
    id: 5,
    title: "离职当晚,我删除了所有同事的微信",
    excerpt: "前言这周末约学弟出来撸串,大热天和啤酒最配。学弟化身为话痨,说着他离职后怒删同事...",
    author: "小鱼人爱编程",
    views: 16000,
    likes: 84,
    favorites: 32,
    tags: ["前端", "后端", "Android"],
  },
  {
    id: 6,
    title: "裁员为什么先裁技术人员?网友一针见血",
    excerpt: "最近逛职场社区的时候,刷到一个职场话题,老生常谈了,但是每次参与讨论的同学都好多。...",
    author: "CodeSheep",
    views: 16000,
    likes: 100,
    favorites: 45,
    tags: ["前端", "后端", "程序员"],
  },
  {
    id: 7,
    title: "2025年的寒冬,我这个大龄程序员失业了",
    excerpt: "2025年的年底,对我来说,并不体面。裁员的通知来得并不突然。大环境不好,这句话我们已经听了三四年。从...",
    author: "17科技",
    views: 12000,
    likes: 89,
    favorites: 22,
    tags: ["前端", "后端"],
  },
];

// 生成更多数据用于测试
const generateMoreArticles = (count: number): Article[] => {
  const baseArticles = [...mockArticles];
  const articles: Article[] = [];
  
  for (let i = 0; i < count; i++) {
    const base = baseArticles[i % baseArticles.length];
    articles.push({
      ...base,
      id: base.id + i * baseArticles.length,
      title: `${base.title} (${i + 1})`,
      views: base.views + Math.floor(Math.random() * 10000),
      likes: base.likes + Math.floor(Math.random() * 100),
      favorites: base.favorites + Math.floor(Math.random() * 50),
    });
  }
  
  return articles;
};

const allArticles = generateMoreArticles(50);

const Recommendation = () => {
  const [activeTab, setActiveTab] = useState<RecommendTabKey>("recommend");

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={styles.recommendContainer}>
      <RecommendTab activeKey={activeTab} onChange={setActiveTab} />
      <div className={styles.listContainer}>
        <List
          dataSource={allArticles}
          pagination={false}
          renderItem={(item) => (
            <List.Item className={styles.listItem}>
              <Link to={`/article/${item.id}`} className={styles.articleLink}>
              <div className={styles.articleContent}>
                <div className={styles.articleMain}>
                  <h3 className={styles.articleTitle}>{item.title}</h3>
                  <p className={styles.articleExcerpt}>{item.excerpt}</p>
                  <div className={styles.articleFooter}>
                    <div className={styles.articleMeta}>
                      <span className={styles.author}>{item.author}</span>
                      <span className={styles.separator}>|</span>
                      <span className={styles.statItem}>
                        👁 {formatNumber(item.views)}
                      </span>
                      <span className={styles.statItem}>
                        👍 {formatNumber(item.likes)}
                      </span>
                      <span className={styles.statItem}>
                        ⭐ {formatNumber(item.favorites)}
                      </span>
                    </div>
                    <div className={styles.tags}>
                    {item.tags.map((tag, index) => (
                      <Tag key={index} className={styles.tag}>
                        {tag}
                      </Tag>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
              </Link>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default Recommendation;
