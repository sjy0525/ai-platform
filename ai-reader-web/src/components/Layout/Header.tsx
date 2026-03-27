import { Link, useNavigate } from "react-router-dom";
import { Button } from "antd";
import SearchBox from "./SearchBox";
import { useUserStore } from "../../store/user";
import styles from "../../styles/Home/Header.module.css";

const Header = () => {
  const { isLoggedIn } = useUserStore();
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/trending?tag=${encodeURIComponent(value.trim())}`);
    }
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
