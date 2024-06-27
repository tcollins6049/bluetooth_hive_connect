import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Imports for other views
import ScanScreen from './views/ScanScreen';
import DeviceListScreen from './views/DeviceListScreen';
import DeviceDetailScreen from './views/DeviceDetailsScreen';
import TabScreen from './views/TabScreen';
// import { BLEManagerProvider } from './ManagerFiles/BLEManagerContext';


const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scan">
          <Stack.Screen name="DeviceList" component={DeviceListScreen} options={{ title: 'Device List' }} />
          <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} options={{ title: 'Device Detail' }} />
          <Stack.Screen name='TabScreen' component={TabScreen} options={{ title: 'Device Details' }} />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;
