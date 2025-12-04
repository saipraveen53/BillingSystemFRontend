import React, { useContext } from 'react'
import { Text, View } from 'react-native'
import { BillContext } from '../(utils)/BillingContext'

const Homepage = () => {
    const {sai,setSai} = useContext(BillContext);
  return (
    <View>
      <Text>This is From : {sai}</Text>
    </View>
  )
}

export default Homepage