import { Stack } from "expo-router";
import BillingContext from '../app/(utils)/BillingContext';
import './globals.css';


export default function RootLayout() {
  return (
<BillingContext>
 <Stack>
      <Stack.Screen name="index"  options={{headerShown:false,headerTitle:"Login Page"}} />
      <Stack.Screen  name="(auth)" options={{headerShown:false}}  />
      <Stack.Screen  name="(home)" options={{headerShown:false}}  />
    </Stack>
</BillingContext>
    
  );
}