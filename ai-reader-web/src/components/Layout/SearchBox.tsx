import { Input } from "antd";
import styles from "../../styles/Home/SearchBox.module.css";

const { Search } = Input;

interface SearchBoxProps {
  onSearch?: (value: string) => void;
  placeholder?: string;
}

const SearchBox = ({ onSearch, placeholder = "搜索文章..." }: SearchBoxProps) => {
  return (
    <div className={styles.searchBox}>
      <Search
        placeholder={placeholder}
        allowClear
        onSearch={onSearch}
        enterButton="搜索"
        size="large"
        className={styles.searchInput}
      />
    </div>
  );
};

export default SearchBox;

