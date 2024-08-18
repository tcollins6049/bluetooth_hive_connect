import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Imports for other views
import PasswordScreen from './src/views/PasswordScreen';
import DeviceListScreen from './src/views/DeviceListScreen';
import DeviceDetailScreen from './src/views/DeviceDetailsScreen';
import VarScreen from './src/views/navigation/VarScreen';
import AudVidScreen from './src/views/navigation/AudVidScreen';
import CustomHeader from './src/modals/CustomHeader';


const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scan">
          <Stack.Screen name="DeviceList" component={DeviceListScreen} options={{ title: 'Device List' }} />
          <Stack.Screen name='Password' component={PasswordScreen} options={{ header: () => <CustomHeader title="Password Verification" /> }} />
          <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} options={{ title: 'Device Detail', header: () => <CustomHeader title="Device Detail" /> }} />
          {/*<Stack.Screen name='TabScreen' component={TabScreen} options={{ title: 'Device Details' }} />*/}
          <Stack.Screen name='VarScreen' component={VarScreen} options={{title: 'Modifications'}} />
          <Stack.Screen name='AudVidScreen' component={AudVidScreen} options={{ title: ''}} />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;
