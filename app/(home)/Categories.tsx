import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { rootApi } from '../(utils)/axiosInstance'

const Categories = () => {   

    useEffect(()=>{
        let fetchCategories =async()=>{
            let response = await rootApi.get(`api/billing/category/all`);
            console.log(response.data)
        }
        fetchCategories();
    },[])
  return (
    <View>
      <Text>Categories</Text>
    </View>
  )
}

export default Categories