import { useEffect } from "react";
import { Card, Avatar, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import { getUserProfileApi } from "../../services";
import styles from "../../styles/User/User.module.css";

const User = () => {
  const navigate = useNavigate();
  const { userInfo, isLoggedIn, logout, setUserInfo } = useUserStore();

  useEffect(() => {
    if (!isLoggedIn) return;
    getUserProfileApi()
      .then((profile) => {
        setUserInfo({
          id: profile.id,
          username: profile.username,
          nickname: profile.nickname,
          avatar: profile.avatar,
          subscribedKeywords: profile.subscribedKeywords || [],
          collectedArticleIds: profile.collectedArticleIds || [],
        });
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });
  }, [isLoggedIn, setUserInfo]);

  if (!isLoggedIn || !userInfo) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <p>请先登录</p>
          <Link to="/login">
            <Button type="primary">去登录</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const avatarChar = userInfo.nickname?.charAt(0) || "读";

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.profileSection}>
          <Avatar size={80} className={styles.avatar}>
            {avatarChar}
          </Avatar>
          <h2 className={styles.nickname}>{userInfo.nickname}</h2>
          <div className={styles.userId}>
            <span>ID {userInfo.id}</span>
          </div>
          <p className={styles.motto}>
            收藏 {userInfo.collectedArticleIds?.length || 0} 篇 · 订阅{" "}
            {userInfo.subscribedKeywords?.length || 0} 个标签
          </p>
        </div>
        <div className={styles.entries}>
          <Link to="/favorite">
            <Button type="default" block className={styles.entryBtn}>
              我的收藏
            </Button>
          </Link>
          <Link to="/subscription">
            <Button type="default" block className={styles.entryBtn}>
              订阅管理
            </Button>
          </Link>
          <Button
            type="default"
            block
            danger
            className={styles.entryBtn}
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            退出登录
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default User;
