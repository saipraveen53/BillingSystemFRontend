import { Tabs } from 'expo-router';
import React, { useState } from 'react';

const Homelayout = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  

  

  return (
    
      <Tabs  screenOptions={{headerShown:false}}  >
        <Tabs.Screen name="Homepage" />
        <Tabs.Screen name="Cashiers" />
      </Tabs>
    
  );
};

export default Homelayout;
