import { useState } from 'react';
import base64 from 'react-native-base64';

import manager from '../../files/BLEManagerSingleton';


// UUID's for needed characteristics
const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
const cpu_file_UUID = '00000303-710e-4a5b-8d75-3e5b444bc3cf';
const cpu_line_UUID = '00000301-710e-4a5b-8d75-3e5b444bc3cf';
const hum_line_UUID = '00000302-710e-4a5b-8d75-3e5b444bc3cf';
const cpu_sensor_UUID = '00000002-710e-4a5b-8d75-3e5b444bc3cf';

// Variables needed for handling file readings
/*const [fileReadings, setFileReadings] = useState({
  cpuTemp: 'N/A',
  humidity: 'N/A',
  temp: 'N/A',
  cpuUpdateString: 'N/A',
  humUpdateString: 'N/A',
  tempUpdateString: 'N/A'
});
const [sensorReadings, setSensorReadings] = useState({
  cpuTemp: 'N/A'
});*/

let deviceId = '';


// Function for setting all data for file, sensor, and graph readings.
const readAndParseFileData_2 = async (device_id: string) => {
  deviceId = device_id;

  // Pulls data from file and sensor
  const cpuLineData = await readCharacteristic(serviceUUID, cpu_line_UUID);
  const humTempLineData = await readCharacteristic(serviceUUID, hum_line_UUID);
  const sensorData = await readCharacteristic(serviceUUID, cpu_sensor_UUID);

  let cpu_results = null;
  let ht_results = null;
  if (cpuLineData) {
    cpu_results = processCpuLineData(cpuLineData);
    ht_results = processHumTempLineData(humTempLineData);
  }

  let sensor_results = null;
  if (sensorData) {
    sensor_results = processSensorData(sensorData);
  }

  return [cpu_results, ht_results, sensor_results];
};


// Function for reading a characteristic from the GATT server
const readCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
  try {
      const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
      return readData;
  } catch (error) {
      console.log("Error while reading data from ble device: ", error);
      return null;
  }
}


// Used to process line from cpu temp reading
const processCpuLineData = (data: any) => {
  if (data.value) {
    let decodedValue = base64.decode(data.value);

    // Get CPU file reading
    const cpuTemp = decodedValue.split(',')[1];
    const cpuString = ((decodedValue.split(',')[2]).split('|')[1]);

    return [cpuTemp, cpuString];
  }
}


// Used to process line from humidity temperature file reading
const processHumTempLineData = (data: any) => {
  if (data.value) {
    let decodedValue = base64.decode(data.value);

    // Get humidity file reading
    const temperature = decodedValue.split(',')[1];
    const tempString = (decodedValue.split('|')[1]);
    const humidity = (decodedValue.split(',')[2]).split('|')[0];

    return [humidity, temperature, tempString]
  }
}


// Used to process data recieved from cpu temp sensor
const processSensorData = (data: any) => {
  return base64.decode(data.value);
}


export default readAndParseFileData_2;
