import { Link } from "react-router-dom";
import { Button } from "antd";
import SearchBox from "./SearchBox";
import { useUserStore } from "../../store/user";
import styles from "../../styles/Home/Header.module.css";

const Header = () => {
  const { isLoggedIn } = useUserStore();

  const handleSearch = (value: string) => {
    console.log("搜索:", value);
    // TODO: 实现搜索逻辑
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        KtReader
      </Link>
      <div className={styles.searchWrapper}>
        <SearchBox onSearch={handleSearch} />
      </div>
      <Link to={isLoggedIn ? "/user-info" : "/login"} className={styles.userCenter}>
        <Button type="primary" size="large">
          {isLoggedIn ? "个人中心" : "先登录"}
        </Button>
      </Link>
    </header>
  );
};

export default Header;
