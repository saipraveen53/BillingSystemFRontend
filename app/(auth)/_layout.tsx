import { Stack } from 'expo-router'
import React from 'react'

const Authlayout = () => {
  return (
    <Stack>
        <Stack.Screen  name='signup'  options={{headerStyle:{backgroundColor:"#ff0000"},headerShown:false}}  />
    </Stack>
  )
}

export default Authlayout