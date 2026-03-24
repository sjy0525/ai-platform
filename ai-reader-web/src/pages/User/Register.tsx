import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../services";
import styles from "../../styles/User/Login.module.css";

interface RegisterFormValues {
  username: string;
  password: string;
  nickname?: string;
}

const Register = () => {
  const [form] = Form.useForm<RegisterFormValues>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      await registerApi(values);
      message.success("注册成功，请登录");
      navigate("/login");
    } catch (error) {
      console.error("注册失败:", error);
      message.error("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} title="注册" bordered={false}>
        <Form
          form={form}
          name="register"
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

          <Form.Item name="nickname" label="昵称">
            <Input placeholder="请输入昵称（可选）" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div className={styles.footer}>
            <Link to="/login">已有账号？去登录</Link>
            <span className={styles.divider}>|</span>
            <Link to="/">返回首页</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
