import { Link } from "react-router-dom";
import styles from "../styles/Home/Home.module.css";
import Header from "../components/Layout/Header";
import HotTagsList from "../components/Layout/HotTagsList";
import HotList from "../components/Layout/HotList";
import Recommendation from "./Recommendation";

const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <Header />
      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <HotTagsList />
        </div>
        <Link to="/subscription" className={styles.subscriptionEntry}>
          订阅入口
        </Link>
        <Link to="/favorite" className={styles.favoriteEntry}>
          文章收藏入口
        </Link>
        <div className={styles.recommendArea}>
          <Recommendation />
        </div>
        <div className={styles.hotListWrapper}>
          <HotList />
        </div>
      </div>
    </div>
  );
};

export default Home;
