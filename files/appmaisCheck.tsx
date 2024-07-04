import manager from '../ManagerFiles/BLEManagerSingleton';
import base64 from 'react-native-base64';
const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';

const isDuringAppmais = async (deviceId: string): Promise<boolean> => {
    const videoStart = (await manager.readCharacteristicForDevice(deviceId, serviceUUID, '00000105-710e-4a5b-8d75-3e5b444bc3cf')).value;
    const videoEnd = (await manager.readCharacteristicForDevice(deviceId, serviceUUID, '00000106-710e-4a5b-8d75-3e5b444bc3cf')).value;
    const videoDur = (await manager.readCharacteristicForDevice(deviceId, serviceUUID, '00000107-710e-4a5b-8d75-3e5b444bc3cf')).value;
    const videoInt = (await manager.readCharacteristicForDevice(deviceId, serviceUUID, '00000108-710e-4a5b-8d75-3e5b444bc3cf')).value;
    const buffer = 5;

    if (videoStart && videoEnd && videoDur && videoInt) {
      const stMatch = (base64.decode(videoStart).match(/^\D*(\d+)\D*/));
      const edMatch = (base64.decode(videoEnd).match(/^\D*(\d+)\D*/));
      const durMatch = (base64.decode(videoDur).match(/^\D*(\d+)\D*/));
      const intMatch = (base64.decode(videoInt).match(/^\D*(\d+)\D*/));

      if (stMatch && edMatch && durMatch && intMatch) { 
        const vStart = parseInt(stMatch[1]);
        const vEnd = parseInt(edMatch[1]);
        const vDuration = parseInt(durMatch[1]);
        const vInterval = parseInt(intMatch[1]);
        console.log(vStart, ":::::::::", vEnd, "::::::::::::::", vDuration, "::::::::::::::::::", vInterval);

        // Convert the start_time number to a string and then parse it into hours and minutes
        const startHours = Math.floor(vStart / 100);
        const startMinutes = vStart % 100;

        // Get the current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();

        // Convert the current time and start time to total seconds since midnight
        const nowInSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
        const startInSeconds = startHours * 3600 + startMinutes * 60;

        // Calculate the difference in seconds
        let secondsBetween = nowInSeconds - startInSeconds;

        const curr_interval = secondsBetween % vInterval;
        console.log(curr_interval);
        if (curr_interval <= (vDuration + buffer) || curr_interval > (vInterval - buffer)) {
          console.log("TRUE");
        } else {
          console.log("FALSE");
        }
      }
      
    }
    
    // console.log("FALSE")
    return true;
}

export default isDuringAppmais;