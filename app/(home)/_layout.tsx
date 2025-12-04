import { Tabs } from 'expo-router'
import React from 'react'

const Homelayout = () => {
  return (
    
    <Tabs>
        <Tabs.Screen name='Homepage' />
        <Tabs.Screen name='Cashiers' />
    </Tabs>

  )
}

export default Homelayout