import { useState } from "react"


function App(){
    
    const [count,setCount] = useState(0)
    return <>
        <div>
            <h1>Hello react+webpack</h1>
            <p>count:{count}</p>
            <button onClick={()=>setCount(count+1)}>count++ </button>
        </div>
    </>
}

export default App