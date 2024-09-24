import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import AudioTab from '../tabs/audio_tab';
import VideoTab from '../tabs/video_tab';


const Tab = createMaterialTopTabNavigator();

/**
 * A tab screen. This screen handles navigation for the audio and video tabs.
 * 
 * @param {any} route
 * @param {any} navigation
 * 
 * @returns 
 */
const AudVidScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Audio">
        {() => <AudioTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
      <Tab.Screen name="Video">
        {() => <VideoTab deviceId={deviceId} deviceName={deviceName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};


export default AudVidScreen;
