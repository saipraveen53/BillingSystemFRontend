import React, { createContext, useState } from 'react';


export const BillContext = createContext();
const BillingContext = ({children}) => {
    const [isAuthenticated,setAuthenticated]= useState(false);
    const [decoded,setDecoded]= useState(null);
    const [role,setRole]=useState("");
  return (
    <BillContext.Provider  value={{isAuthenticated,setAuthenticated,decoded,setDecoded,role,setRole}}  >
        {children}
    </BillContext.Provider>
  )
}

export default BillingContext