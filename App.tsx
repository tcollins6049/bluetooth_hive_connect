import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Imports for other views
import PasswordScreen from './views/PasswordScreen';
import ScanScreen from './views/ScanScreen';
import DeviceListScreen from './views/DeviceListScreen';
import DeviceDetailScreen from './views/DeviceDetailsScreen';
import TabScreen from './views/TabScreen';
import VarScreen from './views/VarScreen';
import AudVidScreen from './views/AudVidScreen';
import CustomHeader from './files/CustomHeader';


const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scan">
          <Stack.Screen name="DeviceList" component={DeviceListScreen} options={{ title: 'Device List' }} />
          <Stack.Screen name='Password' component={PasswordScreen} options={{ header: () => <CustomHeader title="Password Verification" /> }} />
          <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} options={{ title: 'Device Detail', header: () => <CustomHeader title="Device Detail" /> }} />
          <Stack.Screen name='TabScreen' component={TabScreen} options={{ title: 'Device Details' }} />
          <Stack.Screen name='VarScreen' component={VarScreen} options={{title: 'Modifications'}} />
          <Stack.Screen name='AudVidScreen' component={AudVidScreen} options={{ title: ''}} />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;
