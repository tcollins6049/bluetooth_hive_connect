import base64 from 'react-native-base64';
import manager from '../bluetooth/BLEManagerSingleton';


const SERVICE_UUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
const CAPT_WINDOW_START_TIME_UUID = "00000101-710e-4a5b-8d75-3e5b444bc3cf";
const CAPT_WINDOW_END_TIME_UUID = "00000102-710e-4a5b-8d75-3e5b444bc3cf";
const CAPT_DURATION_UUID = "00000103-710e-4a5b-8d75-3e5b444bc3cf";
const CAPT_INTERVAL_UUID = "00000104-710e-4a5b-8d75-3e5b444bc3cf";

/**
 * Determines if the AppMAIS process is currently running or not.
 * Used to make sure certain functions are not ran if AppMAIS is currently running.
 * 
 * @param {string}  deviceId  id of connected device
 * @param {number}  buffer  extra time added to duration to prevent function running at same time as AppMAIS
 * @returns {boolean} True if AppMAIS is running, False if AppMAIS is not running
 */
const isDuringAppmais = async (deviceId: string, buffer: number): Promise<boolean> => {
    // Get needed variables to determine this. [start, end, duration, and interval]
    const videoStart = (await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, CAPT_WINDOW_START_TIME_UUID)).value;
    const videoEnd = (await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, CAPT_WINDOW_END_TIME_UUID)).value;
    const videoDur = (await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, CAPT_DURATION_UUID)).value;
    const videoInt = (await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, CAPT_INTERVAL_UUID)).value;
    // const buffer = 5;

    if (videoStart && videoEnd && videoDur && videoInt) {
      // Read line look like this "interval = 300", Here we are extracting that 300.
      const stMatch = (base64.decode(videoStart).match(/^\D*(\d+)\D*/));
      const edMatch = (base64.decode(videoEnd).match(/^\D*(\d+)\D*/));
      const durMatch = (base64.decode(videoDur).match(/^\D*(\d+)\D*/));
      const intMatch = (base64.decode(videoInt).match(/^\D*(\d+)\D*/));

      if (stMatch && edMatch && durMatch && intMatch) { 
        // Turns values from string into int
        const vStart = parseInt(stMatch[1]);
        const vEnd = parseInt(edMatch[1]);
        const vDuration = parseInt(durMatch[1]);
        const vInterval = parseInt(intMatch[1]);
        // console.log(vStart, ":::::::::", vEnd, "::::::::::::::", vDuration, "::::::::::::::::::", vInterval);  // Uncomment to print these values

        // Convert the start_time number to an int and then parse it into hours and minutes
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

        // Check if the current time is within the bounds of the appmais start and end
        const current_time = (currentHours * 100) + currentMinutes;
        if ((current_time >= vStart && current_time < vEnd) && (curr_interval <= (vDuration + buffer) || curr_interval > (vInterval - buffer))) {
          return true;
        } else {
          return false;
        }
      }
    }
    
    return true;
}


export default isDuringAppmais;
