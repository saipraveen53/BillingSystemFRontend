import React, { createContext, useState } from 'react';


export const BillContext = createContext();
const BillingContext = ({children}) => {
    const [sai,setSai]= useState("SAIPRAVEEN");
  return (
    <BillContext.Provider  value={{sai,setSai}}  >
        {children}
    </BillContext.Provider>
  )
}

export default BillingContext