// Import necessary modules from React and React Native
import { 
    StyleSheet 
} from 'react-native';

// Import navigation components for top tab navigation
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import seperate tabs
import FirstTab from '../tabs/modifications';
import ThirdTab from '../tabs/data';
import FourthTab from '../tabs/sensors';
import FifthTab from '../tabs/commands';

// Instantiate a Bluetooth manager
const Tab = createMaterialTopTabNavigator();


const VarScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Variables">
        {() => <FirstTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Data">
        {() => <ThirdTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Sensors">
        {() => <FourthTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Commands">
        {() => <FifthTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};


export default VarScreen;
