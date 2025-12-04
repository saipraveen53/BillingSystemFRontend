import React, { createContext, useState } from 'react';


export const BillContext = createContext();
const BillingContext = ({children}) => {
    const [isAuthenticated,setAuthenticated]= useState(false);
    const [decoded,setDecoded]= useState(null);
  return (
    <BillContext.Provider  value={{isAuthenticated,setAuthenticated,decoded,setDecoded}}  >
        {children}
    </BillContext.Provider>
  )
}

export default BillingContext