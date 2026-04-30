import { useState, useRef, useEffect } from "react";
import { Button, Input } from "antd";
import { useUserStore } from "../store/user";
import styles from "../styles/AiAssistant.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  articleId: string;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

const AiAssistant = ({ articleId }: Props) => {
  const { isLoggedIn } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 切换文章时清空对话
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [articleId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // 先插入一条空 assistant 消息，流式填充
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = localStorage.getItem("token");
      abortRef.current = new AbortController();

      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ articleId, messages: nextMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const last = [...prev];
          last[last.length - 1] = { role: "assistant", content: "请求失败，请稍后重试。" };
          return last;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setMessages((prev) => {
                const last = [...prev];
                last[last.length - 1] = { role: "assistant", content: parsed.error };
                return last;
              });
              return;
            }
            if (parsed.token) {
              setMessages((prev) => {
                const last = [...prev];
                last[last.length - 1] = {
                  ...last[last.length - 1],
                  content: last[last.length - 1].content + parsed.token,
                };
                return last;
              });
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setMessages((prev) => {
          const last = [...prev];
          last[last.length - 1] = { role: "assistant", content: "连接中断，请重试。" };
          return last;
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleSummarize = () => sendMessage("请用简洁的中文总结这篇文章的核心内容和主要观点。");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>✦</span>
          <span>AI 阅读助手</span>
        </div>
        <div className={styles.loginTip}>
          <p>登录后即可使用 AI 助手</p>
          <Button type="primary" size="small" href="/login">去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>✦</span>
        <span>AI 阅读助手</span>
        {messages.length > 0 && (
          <Button
            type="text"
            size="small"
            className={styles.clearBtn}
            onClick={() => setMessages([])}
          >
            清空
          </Button>
        )}
      </div>

      <div className={styles.quickActions}>
        <Button
          size="small"
          className={styles.quickBtn}
          disabled={streaming}
          onClick={handleSummarize}
        >
          📝 总结文章
        </Button>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p>点击「总结文章」或直接提问</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${msg.role === "user" ? styles.userMsg : styles.assistantMsg}`}
          >
            {msg.role === "assistant" && (
              <div className={styles.msgLabel}>AI</div>
            )}
            <div className={styles.msgContent}>
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className={styles.cursor} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题，Enter 发送，Shift+Enter 换行"
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={streaming}
          className={styles.textarea}
        />
        <div className={styles.inputActions}>
          {streaming ? (
            <Button size="small" danger onClick={handleStop}>
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              disabled={!input.trim()}
              onClick={() => sendMessage(input)}
            >
              发送
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
