import { useState } from "react";
import { Form, Input, Button, Card, Checkbox, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import { loginApi } from "../../services";
import styles from "../../styles/User/Login.module.css";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string; remember?: boolean }) => {
    try {
      setLoading(true);
      const res = await loginApi({
        username: values.username,
        password: values.password,
      });
      localStorage.setItem("token", res.access_token);
      login({
        id: res.user.id,
        nickname: res.user.nickname || res.user.username || "AI读者",
        avatar: res.user.avatar,
      });
      message.success("登录成功");
      navigate("/");
    } catch (error) {
      console.error("登录失败:", error);
      message.error("登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} title="登录" bordered={false}>
        <Form
          form={form}
          name="login"
          layout="vertical"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>

          <div className={styles.footer}>
            <Link to="/user-info">忘记密码？</Link>
            <span className={styles.divider}>|</span>
            <Link to="/">返回首页</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
