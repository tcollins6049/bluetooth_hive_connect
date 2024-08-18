// Import necessary modules from React and React Native
import { 
    StyleSheet 
} from 'react-native';

// Import navigation components for top tab navigation
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import seperate tabs
import SecondTab from '../tabs/audio_tab';
import VideoTab from '../tabs/video_tab';

// Instantiate a Bluetooth manager
const Tab = createMaterialTopTabNavigator();


const AudVidScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Audio">
        {() => <SecondTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Video">
        {() => <VideoTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};


export default AudVidScreen;
