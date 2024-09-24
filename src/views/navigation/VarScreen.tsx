import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import ModTab from '../tabs/modifications';
import SensorTab from '../tabs/sensors';
import CommandTab from '../tabs/commands';


const Tab = createMaterialTopTabNavigator();

/**
 * A tab screen. This screen handles navigation for the modifications, sensor, and command tabs.
 * 
 * @param {any} route
 * @param {any} navigation
 * 
 * @returns 
 */
const VarScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Variables">
        {() => <ModTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Sensors">
        {() => <SensorTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Commands">
        {() => <CommandTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};


export default VarScreen;
