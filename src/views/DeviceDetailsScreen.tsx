import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Animated
} from 'react-native';
import base64 from 'react-native-base64';
import FlashMessage from "react-native-flash-message";
import PagerView from 'react-native-pager-view';
// import { createDrawerNavigator } from '@react-navigation/drawer';

import SideMenu from '../components/SideMenu';
import manager from '../bluetooth/BLEManagerSingleton';
import LineGraph from '../components/Line_graph';
import NanModal from '../modals/NanModal'
import Det_FileRead from './Det_Components/Det_FileRead';


type data = {
  // chartData: { labels: string[]; datasets: { data: number[]; strokeWidth: number }[] };
  chartData: any
  allTimes: string[];
  allValues: string[];
  interpolatedIndices: number[];
  nanCount: number;
  failureCount: number;
};

type nanModal = {
  visible: boolean,
  times: string[],
  values: string[],
  interpolatedIndeces: number[],
  failures: number,
  nanCount: number
}

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
  const CPU_LINE_UUID = '00000301-710e-4a5b-8d75-3e5b444bc3cf';
  const HUMIDITY_LINE_UUID = '00000302-710e-4a5b-8d75-3e5b444bc3cf';
  const SCALE_LINE_UUID = '00000308-710e-4a5b-8d75-3e5b444bc3cf'
  const CPU_SENSOR_UUID = '00000002-710e-4a5b-8d75-3e5b444bc3cf';
  const OFFSET_UUID = '00000305-710e-4a5b-8d75-3e5b444bc3cf';

  // Variables needed for handling file readings
  const [fileReadings, setFileReadings] = useState({
    cpuTemp: 'N/A',
    humidity: 'N/A',
    temp: 'N/A',
    scale: 'N/A',
    cpuUpdateString: 'N/A',
    humUpdateString: 'N/A',
    tempUpdateString: 'N/A',
    scaleUpdateString: 'N/A'
  });

  // Needed for handling sensor reading
  const [sensorReadings, setSensorReadings] = useState({
    cpuTemp: 'N/A'
  });

  const { deviceId, deviceName } = route.params;  // Sets the deviceid and deviceName passed in through route.

  // Variables for handling the nan model
  const [nan_modal, set_nan_modal] = useState<nanModal>({
    visible: false,
    times: [],
    values: [],
    interpolatedIndeces: [],
    failures: 0,
    nanCount: 0
  })

  // Variables needed for line graph creation 
  const [cpuData, setCpuData] = useState<data>({
    chartData: { labels: [], datasets: [{ data: [0], strokeWidth: 2 }] },
    allTimes: [],
    allValues: [],
    interpolatedIndices: [],
    nanCount: 0,
    failureCount: 0
  });

  const [humidityData, setHumidityData] = useState<data>({
    chartData: { labels: [], datasets: [{ data: [0], strokeWidth: 2 }] },
    allTimes: [],
    allValues: [],
    interpolatedIndices: [],
    nanCount: 0,
    failureCount: 0
  })

  const [temperatureData, setTemperatureData] = useState<data>({
    chartData: { labels: [], datasets: [{ data: [0], strokeWidth: 2 }] },
    allTimes: [],
    allValues: [],
    interpolatedIndices: [],
    nanCount: 0,
    failureCount: 0
  })

  const [scaleData, setScaleData] = useState<data>({
    chartData: { labels: [], datasets: [{ data: [0], strokeWidth: 2 }] },
    allTimes: [],
    allValues: [],
    interpolatedIndices: [],
    nanCount: 0,
    failureCount: 0
  })


  // Use effect, Calls functions to get file and graph data. Updates this data every interval minutes.
  useEffect(() => {
    /**
     * Gets file, sensor, and graph data to display on screen.
     */
    const data_start = async() => {
      await readAndParseFileData();   // Get file and sensor data
      await get_graph_data();   // Get data to be used in graph creation
    }

    data_start();
  }, []);


  // ------------------------------- Functions responsible for graph creation ---------------------------------- //
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
   * Used to process data from raspberry pi for each sensor
   * 
   * @param deviceId 
   * @param sensor 
   * @param graphLabels 
   * @param graphValues 
   * @param allLabels 
   * @param allValues 
   * @param nanOccurrences 
   * @param interpolatedIndices 
   * @param updateData 
   */
  const processData = async (
    deviceId: string, 
    sensor_file: string,
    sensor: string,
    graphLabels: string[], 
    graphValues: number[], 
    allLabels: string[], 
    allValues: (number | "nan")[], 
    nanOccurrences: string[], 
    interpolatedIndices: number[],
    updateData: Function
  ) => {
    // Gets sensor data from file on Raspberry Pi.
    const data = await Det_FileRead(deviceId, sensor_file);

    let nanCount = 0;
    let failureCount = 0;
    let nanOccurrenceCount = 0;

    // Iterate through each line of the sensor file
    for (let i = 0; i < data.length; i++) {
        const lineData = data[i];
        
        // Extracts label and value from sensor line
        const linePieces = lineData.split(',');
        const label = linePieces[0];
        let value = linePieces[1];
        if (sensor === "humidity") {
          value = linePieces[2];
        }

        // Pass label and value into handle_graph_value
        const result = await handle_graph_value(
            label, value, graphLabels, graphValues, allLabels, allValues, 
            nanCount, nanOccurrenceCount, failureCount, nanOccurrences, interpolatedIndices
        );

        // Destructure result to update state values
        [graphLabels, graphValues, allLabels, allValues, nanCount, nanOccurrenceCount, failureCount, nanOccurrences, interpolatedIndices] = result;

        // Handle end of data to finalize any remaining NaN values
        if (i === data.length - 1 && nanOccurrences.length > 0) {
            if (nanOccurrences.length >= 3) failureCount++;
            nanOccurrences.forEach(occurrence => {
                allLabels.push(occurrence);
                allValues.push("nan");
            });
        }
    }

    // Update data with results of above
    if (graphValues.length > 0) {
        updateData({
            chartData: { labels: graphLabels, datasets: [{ data: graphValues, strokeWidth: 2 }] },
            allTimes: allLabels,
            allValues: allValues,
            interpolatedIndices: interpolatedIndices,
            nanCount: nanCount,
            failureCount: failureCount
        });
    }
  };


  /**
   * Main function in charge of getting graph data for each sensor.
   */
  const get_graph_data = async () => {
    await resetOffset();

    // Used to hold the resulting sensor data
    const sensorData = {
        cpu: { labels: [], values: [], allLabels: [], allValues: [], nanOccurrences: [], interpolatedIndices: [] },
        humidity: { labels: [], values: [], allLabels: [], allValues: [], nanOccurrences: [], interpolatedIndices: [] },
        temperature: { labels: [], values: [], allLabels: [], allValues: [], nanOccurrences: [], interpolatedIndices: [] },
        scale: {labels: [], values: [], allLabels: [], allValues: [], nanOccurrences: [], interpolatedIndices: [] }
    };

    await processData(
        deviceId, 
        "cpu",
        "cpu",
        sensorData.cpu.labels, 
        sensorData.cpu.values, 
        sensorData.cpu.allLabels, 
        sensorData.cpu.allValues, 
        sensorData.cpu.nanOccurrences, 
        sensorData.cpu.interpolatedIndices,
        (data: any) => setCpuData(prev => ({ ...prev, ...data }))
    );

    await processData(
        deviceId, 
        "ht", 
        "humidity",
        sensorData.humidity.labels, 
        sensorData.humidity.values, 
        sensorData.humidity.allLabels, 
        sensorData.humidity.allValues, 
        sensorData.humidity.nanOccurrences, 
        sensorData.humidity.interpolatedIndices,
        (data: any) => setHumidityData(prev => ({ ...prev, ...data }))
    );

    await processData(
        deviceId, 
        "ht", 
        "temperature",
        sensorData.temperature.labels, 
        sensorData.temperature.values, 
        sensorData.temperature.allLabels, 
        sensorData.temperature.allValues, 
        sensorData.temperature.nanOccurrences, 
        sensorData.temperature.interpolatedIndices,
        (data: any) => setTemperatureData(prev => ({ ...prev, ...data }))
    );

    await processData(
      deviceId,
      "scale",
      "scale",
      sensorData.scale.labels,
      sensorData.scale.values, 
      sensorData.scale.allLabels, 
      sensorData.scale.allValues, 
      sensorData.scale.nanOccurrences, 
      sensorData.scale.interpolatedIndices,
      (data: any) => setScaleData(prev => ({ ...prev, ...data }))
    );
  };


  /**
   * Processes line of data (label, value). Updates passed in arrays with data based on value.
   * If the value is a number then it only updates [graph_labels, graph_values, all_times, all_values].
   * If the value is null then it depends on the nan_occ_count. If nan_occ_count >= 3 then the value remains null.
   * If nan_occ_count < 3 then we keep going but increment nan_occ_count, if our next reading is a number then we can interpolate a value.
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
   */
  const readAndParseFileData = async () => {
    // Pulls data from file and sensor
    const cpuLineData = await readCharacteristic(SERVICE_UUID, CPU_LINE_UUID);
    if (cpuLineData) {
      processCpuLineData(cpuLineData);
    } else {
      setFileReadings(prevState => ({
        ...prevState,
        cpuTemp: "N/A",
        cpuUpdateString: "N/A: No File Found"
      }));
    }

    const scaleLineData = await readCharacteristic(SERVICE_UUID, SCALE_LINE_UUID);
    if (scaleLineData && scaleLineData.value) {
      let decodedValue = base64.decode(scaleLineData.value);
      console.log("SCALE: ", decodedValue.split(',')[1])

      // Get CPU file reading
      const scaleWeight = (decodedValue.split(',')[1]).split('|')[0];
      const scaleString = ((decodedValue.split(',')[1]).split('|')[1]);

      setFileReadings(prevState => ({
        ...prevState,
        scale: scaleWeight,
        scaleUpdateString: scaleString
      }));
    }

    const humTempLineData = await readCharacteristic(SERVICE_UUID, HUMIDITY_LINE_UUID);
    if (humTempLineData) {
      processHumTempLineData(humTempLineData);
    } else {
      setFileReadings(prevState => ({
        ...prevState,
        humidity: "N/A",
        temp: "N/A",
        humUpdateString: "N/A: No File Found",
        tempUpdateString: "N/A: No File Found"
      }))
    }

    const sensorData = await readCharacteristic(SERVICE_UUID, CPU_SENSOR_UUID);
    if (sensorData) {
      processSensorData(sensorData);
    } else {
      setSensorReadings({
        cpuTemp: "N/A"
      })
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
  

  /**
   * Occurs when one of the graph nan buttons are pressed.
   * Sets the nan model visible displaying each points label and value along
   *  with a color indicator [Green: Non interpolated value, Red: 'nan' value, Yellow: Interpolated value]
   * 
   * @param {string[]}  data  Contains the labels for the data list
   * @param {string[]}  values  Contains the values for the data list.
   * @param {number[]}  interpolated_indeces  Contains list of indeces where points were interpolated. So they can be colored differently. 
   */
  const handle_nan_ButtonPress = (data: string[], values: string[], interpolated_indeces: number[], failures: number, nan_readings: number) => {
    set_nan_modal(prevNanModal => ({
      ...prevNanModal,
      visible: true,
      times: data,
      values: values,
      interpolatedIndeces: interpolated_indeces,
      failures: failures,
      nanCount: nan_readings
    }))
  }


  const refreshScreen = () => {
    get_graph_data();
    readAndParseFileData();
  }


  const [isFooterVisible, setIsFooterVisible] = useState(true); // State to toggle footer visibility
  const slideAnim = useRef(new Animated.Value(0)).current; // Initial position

  // Toggle footer visibility and animate slide
  const handleFooterToggle = () => {
    Animated.timing(slideAnim, {
      toValue: isFooterVisible ? 100 : 0,  // Slide in or out
      duration: 300,  // Animation duration
      useNativeDriver: true,  // Use native driver for smoother animation
    }).start();

    setIsFooterVisible(!isFooterVisible); // Toggle visibility state
  };
  return (
    <View style={styles.container}>
      <SideMenu navigation={navigation} deviceId={deviceId} deviceName={deviceName} />

      {/* Header: Refresh Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refreshScreen()}>
          <Image
                source={require('../../assets/images/refresh.png')} // Adjust the path if needed
                style={styles.icon}
            />
        </TouchableOpacity>
      </View>
      
      {/*<ScrollView contentContainerStyle={styles.scrollContainer}>*/}
      <PagerView style={styles.pagerView} initialPage={0} useNext>
        {/* CPU Data and Graph */}
        {/*<View style={styles.graphSection}>*/}
        {/*<View style={styles.card}>*/}
        <View key="1" style={styles.page}>
          <View style={styles.textContainer}>
            <Text style={styles.sectionTitle}>CPU</Text>
            <Text style={styles.updateDate}>{fileReadings.cpuUpdateString}</Text>
            <View style={styles.textRow}>
              <View style={styles.textColumn}>
                <Text style={styles.readingItem}>File: {fileReadings.cpuTemp}</Text>
                <Text style={styles.readingItem}>Sensor: {sensorReadings.cpuTemp}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(cpuData.allTimes, cpuData.allValues, cpuData.interpolatedIndices, cpuData.failureCount, cpuData.nanCount) }>
                <View style={styles.buttonContent}>
                  <View style={styles.purpleDot} />
                  <Text style={styles.actionButtonText}>{ cpuData.failureCount }</Text>
                  <View style={styles.redDot} />
                  <Text style={styles.actionButtonText}> { cpuData.nanCount }</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.graphContainer}>
            <LineGraph
              chartData={cpuData.chartData}
              color_code={'#47786a'}
            />
            <FlashMessage duration={4000} />
          </View>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} /> 
          </View>
        </View>

        {/*<View style={styles.divider} />*/}

        {/* Humidity Data and Graph */}
        {/*<View style={styles.card}>*/}
        <View key="2" style={styles.page}>
          <View style={styles.textContainer}>
            <Text style={styles.sectionTitle}>Humidity</Text>
            <Text style={styles.updateDate}>{fileReadings.humUpdateString}</Text>
            <View style={styles.textRow}>
              <View style={styles.textColumn}>
                <Text style={styles.readingItem}>File: {fileReadings.humidity}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(humidityData.allTimes, humidityData.allValues, humidityData.interpolatedIndices, humidityData.failureCount, humidityData.nanCount) }>
                <View style={styles.buttonContent}>
                  <View style={styles.purpleDot} />
                  <Text style={styles.actionButtonText}>{ humidityData.failureCount }</Text>
                  <View style={styles.redDot} />
                  <Text style={styles.actionButtonText}> { humidityData.nanCount }</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.graphContainer}>
            <LineGraph
              chartData={humidityData.chartData}
              color_code={'#47786a'}
            />
            <FlashMessage duration={4000} />
          </View>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/*<View style={styles.divider} />*/}

        {/* Temperature Data and Graph */}
        {/*<View style={styles.card}>*/}
        <View key="3" style={styles.page}>
          <View style={styles.textContainer}>
            <Text style={styles.sectionTitle}>Temperature</Text>
            <Text style={styles.updateDate}>{fileReadings.tempUpdateString}</Text>
            <View style={styles.textRow}>
              <View style={styles.textColumn}>
                <Text style={styles.readingItem}>File: {fileReadings.temp}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(temperatureData.allTimes, temperatureData.allValues, temperatureData.interpolatedIndices, temperatureData.failureCount, temperatureData.nanCount) }>
                <View style={styles.buttonContent}>
                  <View style={styles.purpleDot} />
                  <Text style={styles.actionButtonText}>{ temperatureData.failureCount }</Text>
                  <View style={styles.redDot} />
                  <Text style={styles.actionButtonText}> { temperatureData.nanCount }</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.graphContainer}>
            <LineGraph
              chartData={temperatureData.chartData}
              color_code={'#47786a'}
            />
          </View>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} /> 
            <View style={styles.dot} />
          </View>
        </View>

        {/*<View style={styles.card}>*/}
        <View key="4" style={styles.page}>
          <View style={styles.textContainer}>
            <Text style={styles.sectionTitle}>Scale</Text>
            <Text style={styles.updateDate}>{fileReadings.scaleUpdateString}</Text>
            <View style={styles.textRow}>
              <View style={styles.textColumn}>
                <Text style={styles.readingItem}>File: {fileReadings.scale}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(scaleData.allTimes, scaleData.allValues, scaleData.interpolatedIndices, scaleData.failureCount, scaleData.nanCount) }>
                <View style={styles.buttonContent}>
                  <View style={styles.purpleDot} />
                  <Text style={styles.actionButtonText}>{ scaleData.failureCount }</Text>
                  <View style={styles.redDot} />
                  <Text style={styles.actionButtonText}> { scaleData.nanCount }</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.graphContainer}>
            <LineGraph
              chartData={scaleData.chartData}
              color_code={'#47786a'}
            />
            <FlashMessage duration={4000} />
          </View>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} /> 
          </View>
        </View>
      {/*</ScrollView>*/}
      </PagerView>

      {/* Footer: Navigation buttons for variable tabs and audio+video tabs */}
      {/*<View style={styles.footer}>
        <TouchableOpacity style={styles.deviceButton} onPress={ () => navigation.navigate('VarScreen', { deviceId: deviceId, deviceName: deviceName})}>
            <Text style={styles.deviceButtonText}>Variables</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deviceButton} onPress={ () => { navigation.navigate('audio', { deviceId: deviceId, deviceName: deviceName })} }>
          <Text style={styles.deviceButtonText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deviceButton} onPress={ () => { navigation.navigate('video', { deviceId: deviceId, deviceName: deviceName })} }>
          <Text style={styles.deviceButtonText}>Video</Text>
        </TouchableOpacity>
      </View>*/}

      <NanModal
        isVisible={nan_modal.visible}
        data={nan_modal.times}
        values={nan_modal.values}
        interpolated_indeces={nan_modal.interpolatedIndeces}
        failures={nan_modal.failures}
        nan_count={nan_modal.nanCount}
        onClose={ () => set_nan_modal(prevNanModal => ({...prevNanModal, visible: false,})) }
      />
    </View>
  );
};


const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, width: '100%' },
  container: { flex: 1, padding: 0, backgroundColor: "#f7f9fc" },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#e0e0e0',
  },
  footer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#e0e0e0'
  },
  deviceButton: {
    marginTop: 10,
    marginVertical: 10,
    paddingVertical: 2,
    marginHorizontal: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  refreshButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  deviceButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  indicator: {
    width: 20,
    height: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'grey', // Default color
  },
  green: { backgroundColor: 'green' },
  red: { backgroundColor: 'red' },
  graphSection: { flex: 1, width: '100%', marginBottom: 20 },
  textContainer: { marginBottom: 5, paddingVertical: 10 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  updateDate: { fontSize: 14, color: '#667', marginBottom: 10 },
  textRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textColumn: { flex: 1 },
  readingItem: { fontSize: 16, color: '#444', marginBottom: 8 },
  actionButton: {
    backgroundColor: '#008B8B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  actionButtonText: { color: '#fff', fontSize: 14, marginRight: 5 },
  graphContainer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
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
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 20 },
  headerContainer: { backgroundColor: 'black' },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    width: "99%",
    alignSelf: 'center',
    marginBottom: 10, // Add some space below each card
  },



  pagerView: {
    flex: 1,
  },
  
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },


  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#333',  // Darker dot for active page
  },
});


export default DeviceDetailScreen;
