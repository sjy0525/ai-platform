import { Card, Avatar, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import styles from "../../styles/User/User.module.css";

const User = () => {
  const navigate = useNavigate();
  const { userInfo, isLoggedIn, logout } = useUserStore();

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
            <Link to="/login">
              <Button type="link" size="small" className={styles.editBtn}>
                编辑
              </Button>
            </Link>
          </div>
          <p className={styles.motto}>发现好文章，分享好内容</p>
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
