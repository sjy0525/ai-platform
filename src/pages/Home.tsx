import React from 'react'
import { Link } from 'react-router-dom'

const Home: React.FC = () => {
  return (
    <div>
      <h1>首页</h1>
      <p>欢迎来到AI平台</p>
      <Link to="/about">查看关于页面</Link>
    </div>
  )
}

export default Home
