// Import necessary modules from React and React Native
import { 
    StyleSheet 
} from 'react-native';

// Import navigation components for top tab navigation
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import seperate tabs
import FirstTab from '../tabs/tab1';
import SecondTab from '../tabs/tab2';
import ThirdTab from '../tabs/tab3';
import FourthTab from '../tabs/tab4';
import FifthTab from '../tabs/tab5';

// Instantiate a Bluetooth manager
const Tab = createMaterialTopTabNavigator();


const FourthTabScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Variables">
        {() => <FirstTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Audio+Video">
        {() => <SecondTab deviceId={deviceId} deviceName={deviceName} />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  variableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginLeft: 10,
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});


export default FourthTabScreen;

