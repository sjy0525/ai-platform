import React from 'react'
import { Link } from 'react-router-dom'

const About: React.FC = () => {
  return (
    <div>
      <h1>关于我们</h1>
      <p>这是一款用户主权式的AI智库式技术平台</p>
      <Link to="/">返回首页</Link>
    </div>
  )
}

export default About
