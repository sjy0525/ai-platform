export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  views: number;
  likes: number;
  favorites: number;
  tags: string[];
}

export const mockArticles: Article[] = [
  {
    id: 1,
    title: "0.1加0.2为什么不等于0.3-答不上来的都挂了",
    excerpt: "0.1+0.2为什么不等于0.3?答不上来的都挂了这个问题你可能在面试、线上Bug、甚至随...",
    content:
      "0.1+0.2为什么不等于0.3?答不上来的都挂了。这个问题你可能在面试、线上Bug、甚至随机抽查中遇到过。在JavaScript中，0.1+0.2的结果是0.30000000000000004，这是由于浮点数的二进制表示导致的精度问题。本文将从原理到解决方案，带你彻底理解浮点数运算。\n\n## 为什么会有精度问题\n\n计算机使用二进制存储数字，而某些十进制小数无法精确转换为二进制，就像1/3无法用有限小数表示一样。\n\n## 解决方案\n\n1. 使用 toFixed 进行四舍五入\n2. 使用 decimal.js 等库进行精确计算\n3. 将金额转换为分（整数）进行计算",
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
    content:
      "作为程序员，你竟然还在手撸代码？如果没有公司给你提供账号，你真能玩转AI？AI只会淘汰不用AI的程序员。本文分享如何利用Cursor、Copilot等工具提升开发效率，拥抱AI时代。\n\n## AI编程工具推荐\n\n- Cursor: 基于VSCode的AI编程助手\n- GitHub Copilot: 代码补全神器\n- Claude: 强大的对话式编程助手",
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
    content:
      "有人23岁全款小米SU7U，有人靠副业一年赚200万。别再被他们PUA了，放过自己吧。你已经是很了不起的成年人了。努力工作，量力而行，不要被社交媒体上的成功学绑架。\n\n## 接纳平凡的自己\n\n每个人都有自己的节奏，比较是偷走快乐的贼。",
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
    content:
      "复盘，从来不只是回看已经发生的事情，更重要的是为尚未发生的未来，提前铺路、校准方向。阿里人的2025年终总结：买房、晋升、订婚、投资，遇见更清晰的自己。\n\n## 年终复盘的意义\n\n通过复盘，我们能够更好地认识自己，规划未来。",
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
    content:
      "前言：这周末约学弟出来撸串，大热天和啤酒最配。学弟化身为话痨，说着他离职后怒删同事微信的故事。离职当晚，我删除了所有同事的微信。是冲动还是解脱？每个人都有自己的选择。\n\n## 职场人际关系\n\n同事关系是否需要延伸到私人社交，每个人有不同的答案。",
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
    content:
      "最近逛职场社区的时候，刷到一个职场话题：裁员为什么先裁技术人员？网友一针见血。老生常谈了，但是每次参与讨论的同学都好多。技术人员的可替代性、成本考量、业务价值等角度，各有说法。\n\n## 技术人的价值\n\n如何提升自己的不可替代性，是每个技术人需要思考的问题。",
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
    content:
      "2025年的年底，对我来说，并不体面。裁员的通知来得并不突然。大环境不好，这句话我们已经听了三四年。2025年的寒冬，我这个大龄程序员失业了。分享我的经历和思考，希望能给同行一些参考。\n\n## 大龄程序员的出路\n\n转型、创业、降薪求职，每条路都不容易，但总要走下去。",
    author: "17科技",
    views: 12000,
    likes: 89,
    favorites: 22,
    tags: ["前端", "后端"],
  },
];

export const allTags = [
  "前端",
  "后端",
  "面试",
  "JavaScript",
  "AI编程",
  "Cursor",
  "AIGC",
  "架构",
  "Android",
  "程序员",
];

// 点赞过的文章 (模拟数据)
export const likedArticles: Article[] = mockArticles.slice(0, 4);

// 收藏过的文章 (模拟数据)
export const favoritedArticles: Article[] = mockArticles.slice(2, 6);

// 生成更多文章用于热榜
const generateTrendingArticles = (): Article[] => {
  const articles: Article[] = [];
  mockArticles.forEach((base) => {
    base.tags.forEach(() => {
      articles.push({
        ...base,
        views: base.views + Math.floor(Math.random() * 5000),
        likes: base.likes + Math.floor(Math.random() * 50),
      });
    });
  });
  return articles;
};

export const trendingArticles: Article[] = generateTrendingArticles();

export const getHotArticlesByTag = (tag: string, limit = 20): Article[] => {
  return trendingArticles
    .filter((a) => a.tags.includes(tag))
    .sort((a, b) => b.views + b.likes - (a.views + a.likes))
    .slice(0, limit);
};
