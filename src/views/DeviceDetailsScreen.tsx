import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import base64 from 'react-native-base64';
import FlashMessage from "react-native-flash-message";

import manager from '../files/BLEManagerSingleton';
import StatusModal from '../modals/StatusModal';
import LineGraph from '../modals/Line_graph';
import NanModal from '../modals/NanModal'
import Det_FileRead from './Det_Components/Det_FileRead';


/**
 * Renders a screen containing basic info for each of the sensors connected to the Raspberry Pi. 
 * For each sensor, shows line graph with all current data as well as the most recent recorded value.
 * Also displays a button which gives more details on the collected sensor data such as nan readings and failures (3 or more nan in a row)
 * 
 * @param {any} route
 * @param {any} navigation
 * 
 * @returns {JSX.Element} A screen displaying current sensor information.
 */
const DeviceDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  // UUID's for needed characteristics
  const SERVICE_UUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
  const cpu_file_UUID = '00000303-710e-4a5b-8d75-3e5b444bc3cf';
  const CPU_LINE_UUID = '00000301-710e-4a5b-8d75-3e5b444bc3cf';
  const HUMIDITY_LINE_UUID = '00000302-710e-4a5b-8d75-3e5b444bc3cf';
  const CPU_SENSOR_UUID = '00000002-710e-4a5b-8d75-3e5b444bc3cf';
  const RECORDING_INTERVAL_UUID = '00000108-710e-4a5b-8d75-3e5b444bc3cf';
  const OFFSET_UUID = '00000305-710e-4a5b-8d75-3e5b444bc3cf';

  // Variables needed for handling file readings
  const [fileReadings, setFileReadings] = useState({
    cpuTemp: 'N/A',
    humidity: 'N/A',
    temp: 'N/A',
    cpuUpdateString: 'N/A',
    humUpdateString: 'N/A',
    tempUpdateString: 'N/A'
  });

  // Needed for handling sensor reading
  const [sensorReadings, setSensorReadings] = useState({
    cpuTemp: 'N/A'
  });

  const { deviceId, deviceName } = route.params;  // Sets the deviceid and deviceName passed in through route.

  // Variables for handling the nan model
  const [nan_modalVisible, set_nan_modalVisible] = useState(false);
  const [nan_modalData, set_nan_modalData] = useState<string[]>([]);
  const [nan_modalValues, set_nan_modalValues] = useState<string[]>([]);
  const [nan_interpolatedIndeces, set_nan_interpolatedIndeces] = useState<number[]>([]);

  // Variables needed for line graph creation 
  const [cpu_chartData, set_cpu_ChartData] = useState<any>(null);   // Data point values and labels passed into the line graph
  const [final_cpu_all_times, set_final_cpu_all_times] = useState<string[]>([]);  // All labels from the read file (for the nan model)
  const [final_cpu_all_values, set_final_cpu_all_values] = useState<string[]>([]);  // All values from the read file (for the nan model)
  const [cpuInterpolatedIndeces, setCpuInterpolatedIndeces] = useState<number[]>([]);   // List of indeces where values were interpolated.
  const [final_cpu_nan_count, set_final_cpu_nan_count] = useState<number>(0);   // Amount of nan values present in file
  const [cpuFailureCount, setCpuFailureCount] = useState<number>(0);  // Amount of failures (3 or more nan readings in a row) present in the file.

  const [humidity_chartData, set_humidity_chartData] = useState<any>(null);
  const [final_humidity_all_times, set_final_humidity_all_times] = useState<any>(null);
  const [final_humidity_all_values, set_final_humidity_all_values] = useState<string[]>([]);
  const [humidityInterpolatedIndeces, setHumidityInterpolatedIndeces] = useState<number[]>([]);
  const [final_humidity_nan_count, set_final_humidity_nan_count] = useState<number>(0);
  const [humidityFailureCount, setHumidityFailureCount] = useState<number>(0);

  const [temperature_chartData, set_temperature_chartData] = useState<any>(null);
  const [final_temperature_all_times, set_final_temperature_all_times] = useState<any>(null);
  const [final_temperature_all_values, set_final_temperature_all_values] = useState<string[]>([]);
  const [temperatureInterpolatedIndeces, setTemperatureInterpolatedIndeces] = useState<number[]>([]);
  const [temperature_nan_count, set_temperature_nan_count] = useState<number>(0);
  const [temperatureFailureCount, setTemperatureFailureCount] = useState<number>(0);


  // Use effect, Calls functions to get file and graph data. Updates this data every interval minutes.
  useEffect(() => {
    /**
     * Gets file, sensor, and graph data to display on screen.
     * 
     */
    const data_start = async() => {
      await readAndParseFileData();   // Get file and sensor data
      await get_graph_data();   // Get data to be used in graph creation

      // Read data every 5 minutes
      const read_interval = (await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, RECORDING_INTERVAL_UUID)).value;
      let interval = 300000; // 5 minutes in milliseconds
      if (read_interval) {
        interval = parseInt((base64.decode(read_interval).match(/^\D*(\d+)\D*/)!)[1]) * 1000;
      }
      const intervalId = setInterval(get_graph_data, 100000);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }

    data_start();
  }, []);


  // ------------------------------- Functions responsible for graph creation ---------------------------------- //
  /**
   * This method gets the file data from the sensor files using the GATT server.
   * It is responsible for getting the data points for the graph and for the info modal.
   * 
   */
  const get_graph_data = async () => {
    // Resets offset for the file within the GATT server, makes sure we start reading from the first line of the file.
    await resetOffset();

    // Create variables to hold data, labels, and nan readings for each sensor
    let cpu_graph_labels: string[] = [];  // Array to hold labels for graph creation (No nan values)
    let cpu_graph_values: number[] = [];  // Array to hold corresponding values for graph creation (No nan values)
    let cpu_all_labels: string[] = [];  // Array to hold all labels (including points where the value was nan)
    let cpu_all_values: string[] = [];  // Array to hold all values (including nan values)
    let cpu_nanCount = 0;   // Holds nan count
    let cpu_failure_count = 0;  // Holds the failure count
    let cpu_interpolated_indeces: number[] = [];  // Array to hold indeces of interpolated values

    let humidity_graph_labels: string[] = [];
    let humidity_graph_values: number[] = [];
    let humidity_all_labels: string[] = [];
    let humidity_all_values: string[] = []
    let humidity_nanCount = 0;
    let hum_failure_count = 0;
    let hum_interpolated_indeces: number[] = [];

    let temperature_graph_labels: string[] = [];
    let temperature_graph_values: number[] = [];
    let temperature_all_labels: string[] = [];
    let temperature_all_values: string[] = [];
    let temperature_nanCount = 0;
    let temp_failure_count = 0;
    let temp_interpolated_indeces: number[] = [];

    // Values below are related to data interpolation
    let cpu_saved_nan_occurences: string[] = [];  // Saves the labels of nan occurences in the file
    let cpu_nan_occurence_count = 0;  // Number of nan occurences in a row so far. Used to detect failures

    let hum_saved_nan_occurences: string[] = [];
    let hum_nan_occurence_count = 0;

    let temp_saved_nan_occurences: string[] = [];
    let temp_nan_occurence_count = 0;


    let cpu_line_data, ht_line_data = null; // Variables to hold the current cpu and ht line data
    const cpu_data = await Det_FileRead(deviceId, "cpu"); // Call Det_FileRead to get cpu file data

    // Loop through each line of data returned from the file.
    for (let i = 0; i < cpu_data.length; i++) {
      cpu_line_data = cpu_data[i];  // Gets next line of data to process

      const cpu_line_pieces = cpu_line_data.split(',');   // cpu lines formatted like this: ""14-10-00",97.3,80.0".
      const cpu_label = cpu_line_pieces[0];
      const cpu_value = cpu_line_pieces[1];

      // Call method to process this line of data
      const result = await handle_graph_value(cpu_label, cpu_value, cpu_graph_labels, cpu_graph_values, cpu_all_labels, cpu_all_values, cpu_nanCount, cpu_nan_occurence_count, cpu_failure_count, cpu_saved_nan_occurences, cpu_interpolated_indeces);
      // Save data from result fro graph and modal related data
      cpu_graph_labels = result[0];
      cpu_graph_values = result[1];
      cpu_all_labels = result[2];
      cpu_all_values = result[3];
      cpu_nanCount = result[4];
      cpu_failure_count = result[6];
      cpu_interpolated_indeces = result[8];
      // Saved data from result for data relating to interpolating values.
      cpu_nan_occurence_count = result[5];
      cpu_saved_nan_occurences = result[7];

      // If we are at the last returned line, if any values are left in the nan_occurences array, deal with them accordingly
      if (i == cpu_data.length - 1) {
        // If we have 3 or more, we have another failure.
        if (cpu_saved_nan_occurences.length >= 3) {
            cpu_failure_count++;
        }

        // Add labels and values for each nan occurence to the overall labels and values arrays.
        for (let t = 0; t < cpu_saved_nan_occurences.length; t++) {
          cpu_all_labels.push(cpu_saved_nan_occurences[t]);
          cpu_all_values.push("nan");
        }

        cpu_saved_nan_occurences = [];
        cpu_nan_occurence_count = 0;
      }
    }

    const ht_data = await Det_FileRead(deviceId, "ht"); // Call Det_FileRead to get Humidity and Temperature data from file

    // Loop through each line from file
    for (let i = 0; i < ht_data.length; i++) {
      ht_line_data = ht_data[i];  // Gets next line of data to process

      // Lines in this file formatted like this: ""14-00-00", 87, 53"
      const ht_line_pieces = ht_line_data.split(',');
      const time = ht_line_pieces[0];
      const temperature = ht_line_pieces[1];
      const humidity = ht_line_pieces[2];

      // Processes line of humidity data.
      const hum_result = await handle_graph_value(time, humidity, humidity_graph_labels, humidity_graph_values, humidity_all_labels, humidity_all_values, humidity_nanCount, hum_nan_occurence_count, hum_failure_count, hum_saved_nan_occurences, hum_interpolated_indeces);
      // Save data from hum_result for graph and modal creation
      humidity_graph_labels = hum_result[0];
      humidity_graph_values = hum_result[1];
      humidity_all_labels = hum_result[2];
      humidity_all_values = hum_result[3];
      humidity_nanCount = hum_result[4];
      hum_failure_count = hum_result[6];
      hum_interpolated_indeces = hum_result[8];
      // Save data from hum_result for dealing with interpolated data
      hum_nan_occurence_count = hum_result[5];
      hum_saved_nan_occurences = hum_result[7];

      // Processes line of temperature data
      const temp_result = await handle_graph_value(time, temperature, temperature_graph_labels, temperature_graph_values, temperature_all_labels, temperature_all_values, temperature_nanCount, temp_nan_occurence_count, temp_failure_count, temp_saved_nan_occurences, temp_interpolated_indeces);
      // Save data from temp_result for graph and modal creation
      temperature_graph_labels = temp_result[0];
      temperature_graph_values = temp_result[1];
      temperature_all_labels = temp_result[2];
      temperature_all_values = temp_result[3];
      temperature_nanCount = temp_result[4];
      temp_failure_count = temp_result[6];
      temp_interpolated_indeces = temp_result[8];
      // Save data from hum_result for dealing with interpolated data
      temp_nan_occurence_count = temp_result[5];
      temp_saved_nan_occurences = temp_result[7];

      // If we are on the final line of data, if any values are left in the nan_occurences array, deal with them accordingly
      if (i == ht_data.length - 1) {
        if (hum_saved_nan_occurences.length > 0) {
          // If there are 3 or more, increment the failure count
          if (hum_saved_nan_occurences.length >= 3) {
            hum_failure_count++;
          }

          // Add these values to the overall data arrays 
          for (let t = 0; t < hum_saved_nan_occurences.length; t++) {
            humidity_all_labels.push(hum_saved_nan_occurences[t]);
            humidity_all_values.push("nan");
          }
          hum_saved_nan_occurences = []
        }

        if (temp_saved_nan_occurences.length > 0) {
          // If there are 3 or more, increment the failure count
          if (temp_saved_nan_occurences.length >= 3) {
            temp_failure_count++;
          }

          // Add these values to the overall data arrays
          for (let t = 0; t < temp_saved_nan_occurences.length; t++) {
            temperature_all_labels.push(temp_saved_nan_occurences[t]);
            temperature_all_values.push("nan");
          }
        }
      }
    }

    // Set cpu chart and overall data
    set_cpu_ChartData({ labels: cpu_graph_labels, datasets: [{ data: cpu_graph_values, strokeWidth: 2 }] });
    set_final_cpu_all_times(cpu_all_labels);
    set_final_cpu_all_values(cpu_all_values);
    set_final_cpu_nan_count(cpu_nanCount);
    setCpuFailureCount(cpu_failure_count);
    setCpuInterpolatedIndeces(cpu_interpolated_indeces);

    // Set humidity chart and overall data
    set_humidity_chartData({ labels: humidity_graph_labels, datasets: [{ data: humidity_graph_values, strokeWidth: 2 }] });
    set_final_humidity_all_times(humidity_all_labels);
    set_final_humidity_all_values(humidity_all_values);
    set_final_humidity_nan_count(humidity_nanCount);
    setHumidityFailureCount(hum_failure_count);
    setHumidityInterpolatedIndeces(hum_interpolated_indeces);

    // Set temperature chart and overall data
    set_temperature_chartData({ labels: temperature_graph_labels, datasets: [{ data: temperature_graph_values, strokeWidth: 2 }] });
    set_final_temperature_all_times(temperature_all_labels);
    set_final_temperature_all_values(temperature_all_values);
    set_temperature_nan_count(temperature_nanCount)
    setTemperatureFailureCount(temp_failure_count);
    setTemperatureInterpolatedIndeces(temp_interpolated_indeces);
  }


  /**
   * Resets the offset in the file we are reading, ensures we start reading from the beginning of the file.
   * 
   */
  const resetOffset = async () => {
    try {
        await manager.writeCharacteristicWithResponseForDevice(
            deviceId,
            SERVICE_UUID,
            OFFSET_UUID,
            base64.encode('reset')
        );

        console.log('Offset reset command sent');
    } catch (error) {
        console.log('Error resetting offset on GATT server:', error);
    }
  };


  /**
   * 
   * 
   * @param {string}  label Label of the point being processed. (labels are time and date of recording)
   * @param {string}  value value of the point being processed.
   * @param {any} graph_labels  labels to be used in creating the graph.
   * @param {any} graph_values  Values to be used in creating the graph. (excludes nan values)
   * @param {any} all_times The labels are times, this contains the times for all points, including nan values.
   * @param {any} all_values  All recorded values, including nan.
   * @param {number}  nanCount Count of nan values.
   * @param {number}  nan_occ_count This counts the number of nan occurences in a row there are so far.
   * @param {number}  failure_count Count of failures. (3 or more nan recordings in a row)
   * @param {any} saved_nan_occs  Saved labels of nan occurences.
   * @param {number[]}  interpolated_index  Indeces of interpolated values.
   * 
   * @returns The updated versions of the passed in variables.
   */
  const handle_graph_value = async (label: string, value: string, graph_labels: any, graph_values: any, all_times: any, all_values: any, 
                                    nanCount: number, nan_occ_count: number, failure_count: number, saved_nan_occs: any, interpolated_index: number[]) => {

    if (value != undefined) {
      value = value.trim();

      // If we get a nan value, add time to nan_times array and increment nan count for cpu.
      if (value.trim() === "nan") {
        nanCount++;   // Increment the nan count

        nan_occ_count++;
        saved_nan_occs.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));  // Save the nan occurence
      } 
      // If we get a real value and there are no saved nan occurences, meaning we don't have to interpolate any data
      else if (value.trim() !== "nan" && saved_nan_occs.length == 0) {
        // Save label and value to both the graph data and the overall data arrays
        graph_labels.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
        graph_values.push(parseFloat(value));

        all_times.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
        all_values.push(value);
      } 
      // The current value is not nan but the nan occurence array is not empty
      else {
        // If we have exactly one saved nan occurence
        if (saved_nan_occs.length == 1) {
          // Makes sure the nan occurence was not the first value read from the file
          if ((graph_values.length - 1) >= 0) {
            // Interpolate a value
            const interpolated_value = (graph_values[graph_values.length - 1] + parseFloat(value)) / 2;

            // Save interpolated value to both the graph data and the overall data
            graph_labels.push(saved_nan_occs[0]); // Push nan time onto labels
            graph_values.push(String(interpolated_value)); // Push interpolated value onto values

            all_times.push(saved_nan_occs[0]); // Push nan time onto labels
            all_values.push(String(interpolated_value)); // Push interpolated value onto values

            interpolated_index.push(all_values.length - 1)  // Push index of interpolated value on the array
          } else {  // If the nan value was the first value read from the file
            all_times.push(saved_nan_occs[0]);
            all_values.push("nan");
          }

          // Also push on the new value to both the graph data and overall data arrays
          graph_labels.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          graph_values.push(parseFloat(value));

          all_times.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          all_values.push(value);

          // Reset the nan occurences
          saved_nan_occs = [];
          nan_occ_count = 0;
        } 
        // If there are exactly 2 saved nan occurences
        else if (saved_nan_occs.length == 2) {
          // Makes sure the nan occurences weren't at the beginning of the file.
          if ((graph_values.length - 1) >= 0) {
            // Caluclate interpolated values
            let increment = (parseFloat(value) - graph_values[graph_values.length - 1]) / 3;
            const interpolated_1 = graph_values[graph_values.length - 1] + increment;
            const interpolated_2 = interpolated_1 + increment;

            // Push first Interpolated value to both the graph data and overall data arrays
            graph_labels.push(saved_nan_occs[0]); // Push nan time onto labels
            graph_values.push(interpolated_1); // Push interpolated value onto values
            all_times.push(saved_nan_occs[0]); // Push nan time onto labels
            all_values.push(String(interpolated_1)); // Push interpolated value onto values

            // Push second Interpolated value to both the graph data and overall data arrays
            graph_labels.push(saved_nan_occs[1]); // Push nan time onto labels
            graph_values.push(interpolated_2); // Push interpolated value onto values
            all_times.push(saved_nan_occs[1]); // Push nan time onto labels
            all_values.push(String(interpolated_2)); // Push interpolated value onto values

            // Save indeces of interpolated values into the interpolated_index array.
            interpolated_index.push(all_values.length - 1)
            interpolated_index.push(all_values.length - 2)
          } else {  // If the nan values were the first values in the file
            // Save both nan occurences to the overall data array.
            all_times.push(saved_nan_occs[0]);
            all_values.push("nan");

            all_times.push(saved_nan_occs[1]);
            all_values.push("nan");
          }

          // Also push on the new value to both the graph data and overall data arrays.
          graph_labels.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          graph_values.push(parseFloat(value));

          all_times.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          all_values.push(value);

          // Reset nan occurences
          saved_nan_occs = [];
          nan_occ_count = 0;

        } else {  // saved_nan_occurences contains more than two nan values
          failure_count++;

          // Add nan values to cpu_nan_times and values arrays
          for (let t = 0; t < saved_nan_occs.length; t++){
            all_times.push(saved_nan_occs[t]);
            all_values.push("nan");
          }

          saved_nan_occs = [];
          nan_occ_count = 0;

          // Also push on the new value to both the graph data and overall data arrays
          graph_labels.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          graph_values.push(parseFloat(value));
          
          all_times.push(label.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
          all_values.push(value);
        }
      }
    }

    return [graph_labels, graph_values, all_times, all_values, nanCount, nan_occ_count, failure_count, saved_nan_occs, interpolated_index]
  }


  // -------------------------------- Functions responsible for file + sensor data --------------------------------- //

  /**
   * Responsible for getting most recent file and sensor readings.
   * 
   */
  const readAndParseFileData = async () => {
    // Pulls data from file and sensor
    const cpuLineData = await readCharacteristic(SERVICE_UUID, CPU_LINE_UUID);
    const humTempLineData = await readCharacteristic(SERVICE_UUID, HUMIDITY_LINE_UUID);
    const sensorData = await readCharacteristic(SERVICE_UUID, CPU_SENSOR_UUID);

    if (cpuLineData) {
      processCpuLineData(cpuLineData);
      processHumTempLineData(humTempLineData);
    }

    if (sensorData) {
      processSensorData(sensorData);
    }
  };


  /**
   * Given the service and characteristic UUID, read data from that characteristic.
   * 
   * @param {string}  serviceUUID UUID of the service.
   * @param {string}  characteristicUUID  UUID of the characteristic being read
   * 
   * @returns Data read from characteristic
   */
  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
    try {
        const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
        return readData;
    } catch (error) {
        console.log("Error while reading data from ble device: ", error);
        return null;
    }
  }


  /**
   * Takes in line of cpu data, processes and return the cpu value along with a cpu string.
   * The cpu string will contain the date and time of teh recording if the cpu value is not 'nan'.
   * If the cpu value is 'nan' then the string will contain the date and time in which nan values began being recorded.
   * 
   * @param {any} data  Data read from characteristic, contains cpu line data
   * 
   * @returns CPU value read from file along with a cpu string.
   */
  const processCpuLineData = (data: any) => {
    if (data.value) {
      let decodedValue = base64.decode(data.value);

      // Get CPU file reading
      const cpuTemp = decodedValue.split(',')[1];
      const cpuString = ((decodedValue.split(',')[2]).split('|')[1]);

      setFileReadings(prevState => ({
        ...prevState,
        cpuTemp: cpuTemp,
        cpuUpdateString: cpuString
      }));

      return [cpuTemp, cpuString];
    }
  }


  /**
   * Takes in line of humidity and temperature data, processes and return the values along with a string.
   * The string will contain the date and time of the recording if the values are not 'nan'.
   * If the value is 'nan' then the string will contain the date and time in which nan values began being recorded.
   * 
   * @param {any} data  Data read from characteristic, contains humidity and temperature line data
   * 
   * @returns Humidity and temperature values read from file along with an update string.
   */
  const processHumTempLineData = (data: any) => {
    if (data.value) {
      let decodedValue = base64.decode(data.value);

      // Get humidity file reading
      const temperature = decodedValue.split(',')[1];
      const tempString = (decodedValue.split('|')[1]);
      const humidity = (decodedValue.split(',')[2]).split('|')[0];

      setFileReadings(prevState => ({
        ...prevState,
        humidity: humidity,
        temp: temperature,
        humUpdateString: tempString,
        tempUpdateString: tempString
      }))

      return [humidity, temperature, tempString]
    }
  }


  /**
   * Processes cpu sensor data read from characteristic.
   * 
   * @param {any} data  CPU temperature read off of Pi.
   */
  const processSensorData = (data: any) => {
      setSensorReadings({
        cpuTemp: base64.decode(data.value)
      })
  }


  // ------------------------------ Methods for status modal ------------------------------------------------------------------ //
  // Variables needed for appmais status screen
  const [status, setStatus] = useState('red');
  const [status_modalVisible, set_status_ModalVisible] = useState<boolean>(false);

  /**
   * Sets the visibility of the status model
   * 
   */
  const toggleStatusModal = () => {
    set_nan_modalVisible(!status_modalVisible);
  }


  // ---------------------------------- Remaining code is for the return, navigation, and buttons --------------------------------------- //

  /**
   * Navigates to screen with tabs variables, sensor enabling, and commands
   * Occurs when the Variables button is pressed.
   * 
   */
  const goToVarScreen = () => {
    navigation.navigate('VarScreen', { deviceId: deviceId, deviceName: deviceName});
  };

  
  /**
   * Navigates to screen with video and audio tabs
   * Occurs when the audio+video button is pressed.
   * 
   */
  const goToAVScreen = () => {
    navigation.navigate('AudVidScreen', { deviceId: deviceId, deviceName: deviceName });
  }

  
  /**
   * Occurs when one of the graph nan buttons are pressed.
   * Sets the nan model visible displaying each points label and value along
   *  with a color indicator [Green: Non interpolated value, Red: 'nan' value, Yellow: Interpolated value]
   * 
   * @param {string[]}  data  Contains the labels for the data list
   * @param {string[]}  values  Contains the values for the data list.
   * @param {number[]}  interpolated_indeces  Contains list of indeces where points were interpolated. So they can be colored differently. 
   */
  const handle_nan_ButtonPress = (data: string[], values: string[], interpolated_indeces: number[]) => {
    set_nan_modalData(data);
    set_nan_modalValues(values);
    set_nan_interpolatedIndeces(interpolated_indeces)
    set_nan_modalVisible(true);
  }


  /**
   * Occurs when pressing the close button on a nan model. Closes the model.
   * 
   */
  const handle_close_nan_modal = () => {
    set_nan_modalVisible(false);
  }


  return (
    <View style={styles.container}>
      {/* Header: AppMAIS Status */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.deviceButton} onPress={toggleStatusModal}>
            <Text style={styles.deviceButtonText}>AppMAIS Status</Text>
        </TouchableOpacity>
        <View style={[styles.indicator, status === 'green' && styles.green]} />
        <View style={[styles.indicator, status === 'red' && styles.red]} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* CPU Data and Graph */}
        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>CPU</Text>
          <Text style={styles.updateDate}>{fileReadings.cpuUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>File: {fileReadings.cpuTemp}</Text>
              <Text style={styles.readingItem}>Sensor: {sensorReadings.cpuTemp}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(final_cpu_all_times, final_cpu_all_values, cpuInterpolatedIndeces) }>
              <View style={styles.buttonContent}>
                <View style={styles.purpleDot} />
                <Text style={styles.actionButtonText}>{ cpuFailureCount }</Text>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { final_cpu_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={cpu_chartData}
            color_code={'#47786a'}
          />
          <FlashMessage duration={4000} />
        </View>
        </View>

        <View style={styles.divider} />

        {/* Humidity Data and Graph */}
        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Humidity</Text>
          <Text style={styles.updateDate}>{fileReadings.humUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>Most Recent File Reading: {fileReadings.humidity}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(final_humidity_all_times, final_humidity_all_values, humidityInterpolatedIndeces) }>
              <View style={styles.buttonContent}>
                <View style={styles.purpleDot} />
                <Text style={styles.actionButtonText}>{ humidityFailureCount }</Text>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { final_humidity_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={humidity_chartData}
            color_code={'#47786a'}
          />
          <FlashMessage duration={4000} />
        </View>
        </View>

        <View style={styles.divider} />

        {/* Temperature Data and Graph */}
        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Temperature</Text>
          <Text style={styles.updateDate}>{fileReadings.tempUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>File: {fileReadings.temp}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(final_temperature_all_times, final_temperature_all_values, temperatureInterpolatedIndeces) }>
              <View style={styles.buttonContent}>
                <View style={styles.purpleDot} />
                <Text style={styles.actionButtonText}>{ temperatureFailureCount }</Text>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { temperature_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={temperature_chartData}
            color_code={'#47786a'}
          />
        </View>
        </View>
      </ScrollView>

      {/* Footer: Navigation buttons for variable tabs and audio+video tabs */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deviceButton} onPress={goToVarScreen}>
            <Text style={styles.deviceButtonText}>Variables</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deviceButton} onPress={goToAVScreen}>
            <Text style={styles.deviceButtonText}>Aud + Vid</Text>
        </TouchableOpacity>
      </View>

      <NanModal
        isVisible={nan_modalVisible}
        data={nan_modalData}
        values={nan_modalValues}
        interpolated_indeces={nan_interpolatedIndeces}
        onClose={handle_close_nan_modal}
      />

    </View>
  );
};


const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  footer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  deviceButton: {
    marginTop: 10,
    marginVertical: 10,
    paddingVertical: 2,
    marginHorizontal: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  deviceButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  indicator: {
    width: 20,
    height: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'grey', // Default color
  },
  green: {
    backgroundColor: 'green',
  },
  red: {
    backgroundColor: 'red',
  },
  graphSection: {
    flex: 1,
    width: '100%',
    marginBottom: 20,
  },
  textContainer: {
    marginBottom: 5, // Space between text and graph
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  updateDate: {
    fontSize: 14,
    color: '#667',
    marginBottom: 10,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  readingItem: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  graphContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    alignSelf: 'center',
  },

  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginRight: 5,
  },
  purpleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'purple',
    marginRight: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },

  headerContainer: {
    backgroundColor: 'black'
  }
});

export default DeviceDetailScreen;
