
import { Outlet, Link } from "react-router-dom"

function App(){
    
 
    return <>
        <div>
            <h1>AI Platform</h1>
            <nav>
                <ul style={{ display: 'flex', gap: '20px', listStyle: 'none' }}>
                    <li><Link to="/">首页</Link></li>
                    <li><Link to="/about">关于我们</Link></li>
                </ul>
            </nav>
            
            <div style={{ marginTop: '20px' }}>
                <Outlet /> {/* 路由出口，显示子路由内容 */}
            </div>
        </div>
    </>
}

export default App