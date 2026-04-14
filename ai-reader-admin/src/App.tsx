import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './services/api';
import { trackAdminEvent } from './services/analytics';
import type {
  AdminArticleItem,
  AdminColumnItem,
  AdminTab,
  AdminUserItem,
  AnalyticsEventItem,
  OverviewData,
} from './types';

const tabLabels: Record<AdminTab, string> = {
  overview: '数据总览',
  users: '用户管理',
  articles: '文章管理',
  columns: '专栏管理',
  events: '埋点日志',
};

const emptyColumnForm = {
  id: '',
  name: '',
  keyword: '',
  description: '',
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [adminName, setAdminName] = useState(() => {
    const raw = localStorage.getItem('admin_user');
    return raw ? (JSON.parse(raw) as { username?: string }).username || '' : '';
  });
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [articles, setArticles] = useState<AdminArticleItem[]>([]);
  const [columns, setColumns] = useState<AdminColumnItem[]>([]);
  const [events, setEvents] = useState<AnalyticsEventItem[]>([]);

  const [articleQuery, setArticleQuery] = useState('');
  const [articleTag, setArticleTag] = useState('');
  const [articleSource, setArticleSource] = useState('');
  const [columnForm, setColumnForm] = useState(emptyColumnForm);

  const tagOptions = useMemo(
    () => Array.from(new Set(articles.map((item) => item.tag).filter(Boolean))),
    [articles],
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(articles.map((item) => item.source).filter(Boolean))),
    [articles],
  );

  useEffect(() => {
    if (!token) return;
    void loadTabData('overview');
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void trackAdminEvent('admin_view_change', { tab: activeTab });
  }, [activeTab, token]);

  async function loadTabData(tab: AdminTab) {
    setLoading(true);
    setError('');

    try {
      if (tab === 'overview') {
        const data = await adminApi.getOverview();
        setOverview(data);
      }

      if (tab === 'users') {
        const data = await adminApi.getUsers();
        setUsers(data);
      }

      if (tab === 'articles') {
        const data = await adminApi.getArticles({
          q: articleQuery || undefined,
          tag: articleTag || undefined,
          source: articleSource || undefined,
        });
        setArticles(data);
      }

      if (tab === 'columns') {
        const data = await adminApi.getColumns();
        setColumns(data);
      }

      if (tab === 'events') {
        const data = await adminApi.getEvents();
        setEvents(data);
      }
    } catch (err) {
      const nextError = err instanceof Error ? err.message : '加载失败';
      setError(nextError);
      if (nextError.includes('401') || nextError.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!username || !password) {
      setError('请输入管理员账号和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await adminApi.login(username, password);
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.admin));
      setToken(response.access_token);
      setAdminName(response.admin.username);
      setNotice('登录成功');
      void trackAdminEvent('admin_login_success', { username: response.admin.username });
      void loadTabData('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken('');
    setAdminName('');
    setOverview(null);
    setUsers([]);
    setArticles([]);
    setColumns([]);
    setEvents([]);
    setNotice('已退出登录');
  }

  async function refreshCurrentTab(tab = activeTab) {
    await loadTabData(tab);
  }

  async function handleSyncHotArticles() {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await adminApi.syncHotArticles();
      setNotice(result.message);
      await trackAdminEvent('admin_sync_hot_articles_click');
      await Promise.all([loadTabData('overview'), loadTabData('articles')]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
      setLoading(false);
    }
  }

  async function handleSubmitColumn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!columnForm.name.trim() || !columnForm.keyword.trim()) {
      setError('请填写专栏名称和关键词');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (columnForm.id) {
        await adminApi.updateColumn(columnForm.id, {
          name: columnForm.name,
          keyword: columnForm.keyword,
          description: columnForm.description,
        });
        await trackAdminEvent('admin_update_column_submit', {
          columnId: columnForm.id,
          keyword: columnForm.keyword,
        });
        setNotice('专栏更新成功');
      } else {
        await adminApi.createColumn({
          name: columnForm.name,
          keyword: columnForm.keyword,
          description: columnForm.description,
        });
        await trackAdminEvent('admin_create_column_submit', {
          keyword: columnForm.keyword,
        });
        setNotice('专栏创建成功');
      }

      setColumnForm(emptyColumnForm);
      await loadTabData('columns');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存专栏失败');
      setLoading(false);
    }
  }

  async function handleDeleteColumn(id: string) {
    if (!window.confirm('确认删除该专栏吗？')) return;
    setLoading(true);
    setError('');
    setNotice('');

    try {
      await adminApi.deleteColumn(id);
      await trackAdminEvent('admin_delete_column_click', { columnId: id });
      setNotice('专栏删除成功');
      if (columnForm.id === id) {
        setColumnForm(emptyColumnForm);
      }
      await loadTabData('columns');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除专栏失败');
      setLoading(false);
    }
  }

  async function handleSearchArticles() {
    await trackAdminEvent('admin_search_articles', {
      query: articleQuery,
      tag: articleTag,
      source: articleSource,
    });
    await loadTabData('articles');
  }

  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-badge">AI Reader Admin</div>
          <h1>后台管理系统</h1>
          <p>默认管理员账号可通过后端环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 配置。</p>
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              <span>管理员账号</span>
              <input name="username" placeholder="admin" autoComplete="username" />
            </label>
            <label>
              <span>管理员密码</span>
              <input
                name="password"
                type="password"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? '登录中...' : '进入后台'}
            </button>
          </form>
          {error ? <div className="feedback error">{error}</div> : null}
          {notice ? <div className="feedback success">{notice}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">AI Reader</div>
          <div className="brand-subtitle">React 管理后台</div>
        </div>
        <nav className="nav-list">
          {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={tab === activeTab ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setActiveTab(tab);
                void loadTabData(tab);
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-chip">当前管理员：{adminName}</div>
          <button className="ghost-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>{tabLabels[activeTab]}</h2>
            <p>已接入管理操作埋点，可在埋点日志页查看关键行为。</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn" onClick={() => void refreshCurrentTab()}>
              刷新数据
            </button>
            <button className="primary-btn" onClick={() => void handleSyncHotArticles()}>
              手动同步热榜
            </button>
          </div>
        </header>

        {error ? <div className="feedback error">{error}</div> : null}
        {notice ? <div className="feedback success">{notice}</div> : null}
        {loading ? <div className="loading-banner">正在加载，请稍候...</div> : null}

        {activeTab === 'overview' && overview ? (
          <section className="page-section">
            <div className="card-grid">
              <StatCard label="用户总数" value={overview.summary.userCount} />
              <StatCard label="文章总数" value={overview.summary.articleCount} />
              <StatCard label="专栏总数" value={overview.summary.columnCount} />
              <StatCard label="埋点事件" value={overview.summary.eventCount} />
              <StatCard label="总收藏量" value={overview.summary.totalCollections} />
              <StatCard
                label="专栏订阅量"
                value={overview.summary.totalColumnSubscriptions}
              />
            </div>

            <div className="panel-grid">
              <Panel title="标签分布">
                <SimpleBarList items={overview.tagDistribution} />
              </Panel>
              <Panel title="来源分布">
                <SimpleBarList items={overview.sourceDistribution} />
              </Panel>
            </div>

            <div className="panel-grid">
              <Panel title="最近新增用户">
                <SimpleTable
                  headers={['用户名', '昵称', '收藏数', '订阅专栏数', '创建时间']}
                  rows={overview.recentUsers.map((item) => [
                    item.username,
                    item.nickname,
                    String(item.collectedArticleCount),
                    String(item.subscribedColumnCount),
                    formatDate(item.createdAt),
                  ])}
                />
              </Panel>
              <Panel title="最近埋点事件">
                <SimpleTable
                  headers={['事件名', '触发人', '来源', '时间']}
                  rows={overview.recentEvents.map((item) => [
                    item.event,
                    item.distinctId,
                    item.source,
                    formatDate(item.createdAt),
                  ])}
                />
              </Panel>
            </div>
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className="page-section">
            <Panel title="用户列表">
              <SimpleTable
                headers={['用户名', '昵称', '关键词订阅', '收藏数', '专栏订阅数', '创建时间']}
                rows={users.map((user) => [
                  user.username,
                  user.nickname,
                  user.subscribedKeywords.join('、') || '-',
                  String(user.collectedArticleCount),
                  String(user.subscribedColumnCount),
                  formatDate(user.createdAt),
                ])}
              />
            </Panel>
          </section>
        ) : null}

        {activeTab === 'articles' ? (
          <section className="page-section">
            <Panel title="文章查询">
              <div className="toolbar">
                <input
                  value={articleQuery}
                  onChange={(event) => setArticleQuery(event.target.value)}
                  placeholder="按标题或作者搜索"
                />
                <select
                  value={articleTag}
                  onChange={(event) => setArticleTag(event.target.value)}
                >
                  <option value="">全部标签</option>
                  {tagOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={articleSource}
                  onChange={(event) => setArticleSource(event.target.value)}
                >
                  <option value="">全部来源</option>
                  {sourceOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button className="primary-btn" onClick={() => void handleSearchArticles()}>
                  查询
                </button>
              </div>
            </Panel>

            <Panel title="文章列表">
              <SimpleTable
                headers={['标题', '作者', '热度', '来源', '标签', '创建时间']}
                rows={articles.map((article) => [
                  article.title,
                  article.author || '-',
                  String(article.hot || 0),
                  article.source || '-',
                  article.tag || '-',
                  formatDate(article.createdAt),
                ])}
              />
            </Panel>
          </section>
        ) : null}

        {activeTab === 'columns' ? (
          <section className="page-section two-column">
            <Panel title={columnForm.id ? '编辑专栏' : '新增专栏'}>
              <form onSubmit={handleSubmitColumn} className="form-grid">
                <label>
                  <span>专栏名称</span>
                  <input
                    value={columnForm.name}
                    onChange={(event) =>
                      setColumnForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="例如：React 生态"
                  />
                </label>
                <label>
                  <span>关联关键词</span>
                  <input
                    value={columnForm.keyword}
                    onChange={(event) =>
                      setColumnForm((prev) => ({ ...prev, keyword: event.target.value }))
                    }
                    placeholder="例如：react"
                  />
                </label>
                <label>
                  <span>专栏描述</span>
                  <textarea
                    value={columnForm.description}
                    onChange={(event) =>
                      setColumnForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="描述专栏定位与主题"
                    rows={5}
                  />
                </label>
                <div className="action-row">
                  <button type="submit" className="primary-btn">
                    {columnForm.id ? '保存修改' : '创建专栏'}
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setColumnForm(emptyColumnForm)}
                  >
                    清空
                  </button>
                </div>
              </form>
            </Panel>

            <Panel title="专栏列表">
              <div className="column-list">
                {columns.map((column) => (
                  <div key={column.id} className="column-card">
                    <div>
                      <h4>{column.name}</h4>
                      <p>{column.description || '暂无描述'}</p>
                      <div className="meta-row">关键词：{column.keyword}</div>
                      <div className="meta-row">创建时间：{formatDate(column.createdAt)}</div>
                    </div>
                    <div className="action-row">
                      <button
                        className="ghost-btn"
                        onClick={() => setColumnForm(column)}
                      >
                        编辑
                      </button>
                      <button
                        className="danger-btn"
                        onClick={() => void handleDeleteColumn(column.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <section className="page-section">
            <Panel title="埋点日志">
              <SimpleTable
                headers={['事件名', '触发人', '来源', '属性', '时间']}
                rows={events.map((item) => [
                  item.event,
                  item.distinctId,
                  item.source,
                  JSON.stringify(item.properties || {}),
                  formatDate(item.createdAt),
                ])}
              />
            </Panel>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatCard(props: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{props.title}</h3>
      </div>
      <div className="panel-body">{props.children}</div>
    </section>
  );
}

function SimpleBarList(props: { items: Array<{ name: string; value: number }> }) {
  if (props.items.length === 0) {
    return <div className="empty-state">暂无数据</div>;
  }

  const max = Math.max(...props.items.map((item) => item.value), 1);

  return (
    <div className="bar-list">
      {props.items.map((item) => (
        <div key={`${item.name}-${item.value}`} className="bar-item">
          <div className="bar-meta">
            <span>{item.name}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleTable(props: { headers: string[]; rows: string[][] }) {
  if (props.rows.length === 0) {
    return <div className="empty-state">暂无数据</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {props.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export default App;
