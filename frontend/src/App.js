import React, { useEffect, useState } from 'react';
import Message from './Components/Message';
import Logo from './Components/Logo';
function App() {

 const [showlogo,setlogo] = useState(true);

 useEffect(()=>{
       
   const time=   setTimeout(()=>{
            setlogo(false);
      },5000);

      return ()=> clearTimeout(time);

 },[])
  return (
    <>
    {showlogo ? <Logo/> : <Message/> }
    </>
  );
}

export default App;
