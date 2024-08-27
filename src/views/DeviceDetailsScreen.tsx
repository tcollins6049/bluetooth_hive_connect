import React, { useEffect, useState } from 'react';
import { View, PermissionsAndroid, Button, Alert, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import base64 from 'react-native-base64';

import manager from '../files/BLEManagerSingleton';
import StatusModal from '../modals/StatusModal';
import LineGraph from '../modals/Line_graph';
import NanModal from '../modals/NanModal'


const DeviceDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  // UUID's for needed characteristics
  const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
  const cpu_file_UUID = '00000303-710e-4a5b-8d75-3e5b444bc3cf';
  const cpu_line_UUID = '00000301-710e-4a5b-8d75-3e5b444bc3cf';
  const hum_line_UUID = '00000302-710e-4a5b-8d75-3e5b444bc3cf';
  const cpu_sensor_UUID = '00000002-710e-4a5b-8d75-3e5b444bc3cf';

  // Variables needed for handling file readings
  const [fileReadings, setFileReadings] = useState({
    cpuTemp: 'N/A',
    humidity: 'N/A',
    temp: 'N/A',
    cpuUpdateString: 'N/A',
    humUpdateString: 'N/A',
    tempUpdateString: 'N/A'
  });
  const [sensorReadings, setSensorReadings] = useState({
    cpuTemp: 'N/A'
  });
  const { deviceId, deviceName } = route.params;


  const [nan_modalVisible, set_nan_modalVisible] = useState(false);
  const [nan_modalData, set_nan_modalData] = useState<string[]>([]);
  const [nan_modalValues, set_nan_modalValues] = useState<string[]>([]);

  // Variables needed for line graph creation
  const [cpu_chartData, set_cpu_ChartData] = useState<any>(null);
  const [final_cpu_full_times, set_final_cpu_full_times] = useState<string[]>([]);
  const [final_cpu_nan_count, set_final_cpu_nan_count] = useState<number>(0);
  const [final_cpu_full_values, set_final_cpu_full_values] = useState<string[]>([]);

  const [humidity_chartData, set_humidity_chartData] = useState<any>(null);
  const [final_humidity_all_times, set_final_humidity_all_times] = useState<any>(null);
  const [final_humidity_nan_count, set_final_humidity_nan_count] = useState<number>(0);
  const [final_humidity_full_values, set_final_humidity_full_values] = useState<string[]>([]);

  const [temperature_chartData, set_temperature_chartData] = useState<any>(null);
  const [temperature_nans, set_temperature_nans] = useState<any>(null);
  const [temperature_nan_count, set_temperature_nan_count] = useState<number>(0);
  const [final_temperature_all_values, set_final_temperature_all_values] = useState<string[]>([]);


  // Use effect specifying what happens when this screen is opened
  useEffect(() => {
    const data_start = async() => {
      await readAndParseFileData();
      await get_graph_data();

      // Read data every 5 minutes
      // const intervalId = setInterval(readAndParseCpuFileData, 300000);

      // Cleanup interval on unmount
      // return () => clearInterval(intervalId);
    }

    data_start();
  }, []);


  const resetOffset = async () => {
    try {
        await manager.writeCharacteristicWithResponseForDevice(
            deviceId,
            serviceUUID,
            '00000305-710e-4a5b-8d75-3e5b444bc3cf',
            base64.encode('reset')
        );

        console.log('Offset reset command sent');
    } catch (error) {
        console.log('Error resetting offset on GATT server:', error);
    }
  };


  /**
   * This method gets the file data from the sensor files using the GATT server.
   * It is responsible for getting the data points for the graph and also the nan counts and times which nan values occured.
   */
  const get_graph_data = async () => {
    // Resets offset for the file within the GATT server, makes sure we start reading from the first line of the file.
    await resetOffset();

    // Create variables to hold data, labels, and nan readings for each sensor
    const cpu_labels: string[] = [];
    const cpu_values: number[] = [];
    const cpu_nan_times: string[] = [];
    const cpu_nan_values: string[] = [];
    let cpu_nanCount = 0;

    const humidity_labels: string[] = [];
    const humidity_values: number[] = [];
    const humidity_nan_times: string[] = [];
    const humidity_nan_values: string[] = []
    let humidity_nanCount = 0;

    const temperature_labels: string[] = [];
    const temperature_values: number[] = [];
    const temperature_nan_times: string[] = [];
    const temperature_nan_values: string[] = [];
    let temperature_nanCount = 0;


    let cpu_line_data, ht_line_data = null;
    let cpu_eof, ht_eof = false;  // Used to keep track of when EOFs are hit
    while (true) {
      // Checks if we have hit the EOF within the cpu file.
      if (!cpu_eof) {
        // Read line of data from the cpu temperature file located at /home/bee/appmais/bee_tmp/cpu/
        const cpu_result = await readCharacteristic(serviceUUID, '00000304-710e-4a5b-8d75-3e5b444bc3cf');
        cpu_line_data = base64.decode(cpu_result!.value!);  // Decode result from base 64

        // Characteristic adds "EOF" to end of file. If we hit EOF then we are done reading the file.
        if (!(cpu_line_data === "EOF")) {
          const cpu_line_pieces = cpu_line_data.split(',');   // cpu lines formatted like this: ""14-10-00",97.3,80.0".

          if (cpu_line_pieces[1] != undefined) {
            // If we get a nan value, add time to nan_times array and increment nan count for cpu.
            // Else, add the time to the cpu_labels array and add the value to the cpu_values array
            if (cpu_line_pieces[1] === "nan") {
              cpu_nan_times.push(cpu_line_pieces[0].substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              cpu_nan_values.push(cpu_line_pieces[1]);
              cpu_nanCount++;
            } else {
              cpu_labels.push(cpu_line_pieces[0].substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              cpu_values.push(parseFloat(cpu_line_pieces[1]));
              cpu_nan_times.push(cpu_line_pieces[0].substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              cpu_nan_values.push(cpu_line_pieces[1]);
            }
          }
        } else {
          cpu_eof = true;   // We hit the EOF therefore we set cpu_eof to true
        }
      }

      // Checks if we have hit the EOF within the combined temp and humidity file
      if (!ht_eof) {
        // Read line of data from the combined humidity and temperature file located at /home/bee/appmais/bee_tmp/temp/
        const ht_result = await readCharacteristic(serviceUUID, '00000306-710e-4a5b-8d75-3e5b444bc3cf');
        ht_line_data = base64.decode(ht_result!.value!);  // Decode result from base 64

        // Checks if we are hitting the EOF.
        if (!(ht_line_data === "EOF")) {
          // Lines in this file formatted like this: ""14-00-00", 87, 53"
          const ht_line_pieces = ht_line_data.split(',');
          const time = ht_line_pieces[0];
          const temperature = ht_line_pieces[1];
          const humidity = ht_line_pieces[2];

          if (humidity != undefined) {
            // If we get a nan value, add time to nan_times array and increment nan count for cpu.
            // Else, add the time to the humidity_labels array and add the value to the humidity_values array
            if (humidity.trim() == "nan") {
              humidity_nan_times.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              humidity_nan_values.push(humidity);
              humidity_nanCount++;
            } else {
              humidity_labels.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              humidity_nan_times.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              humidity_values.push(parseFloat(humidity));
              humidity_nan_values.push(humidity);
            }
          }

          if (temperature != undefined) {
            // If we get a nan value, add time to nan_times array and increment nan count for cpu.
            // Else, add the time to the temperature_labels array and add the value to the temperature_values array
            if (temperature.trim() == "nan") {
              temperature_nan_times.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              temperature_nan_values.push(temperature);
              temperature_nanCount++;
            } else {
              temperature_labels.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              temperature_nan_times.push(time.substring(0, 6).replace(/"/g, '').replace(/-/g, ':'));
              temperature_nan_values.push(temperature);
              temperature_values.push(parseFloat(temperature));
            }
          }
        } else {
          ht_eof = true;  // We hit the EOF therefore we set ht_eof to true
        }
      }

      if (ht_eof && cpu_eof) {
        break;
      }
    }

    // Set cpu chart and nan data
    set_cpu_ChartData({ cpu_labels, datasets: [{ data: cpu_values, strokeWidth: 2 }] });
    set_final_cpu_full_times(cpu_nan_times);
    set_final_cpu_nan_count(cpu_nanCount);
    set_final_cpu_full_values(cpu_nan_values);

    // Set humidity chart and nan data
    set_humidity_chartData({ humidity_labels, datasets: [{ data: humidity_values, strokeWidth: 2 }] });
    set_final_humidity_all_times(humidity_nan_times);
    set_final_humidity_nan_count(humidity_nanCount);
    set_final_humidity_full_values(humidity_nan_values);

    // Set temperature chart and nan data
    set_temperature_chartData({ temperature_labels, datasets: [{ data: temperature_values, strokeWidth: 2 }] });
    set_temperature_nans(temperature_nan_times);
    set_temperature_nan_count(temperature_nanCount)
    set_final_temperature_all_values(temperature_nan_values);
  }


  // Function for setting all data for file, sensor, and graph readings.
  const readAndParseFileData = async () => {
    // Pulls data from file and sensor
    const cpuLineData = await readCharacteristic(serviceUUID, cpu_line_UUID);
    const humTempLineData = await readCharacteristic(serviceUUID, hum_line_UUID);
    const sensorData = await readCharacteristic(serviceUUID, cpu_sensor_UUID);
    if (cpuLineData) {
      processCpuLineData(cpuLineData);
      processHumTempLineData(humTempLineData);
    }

    if (sensorData) {
      processSensorData(sensorData);
    }
  };


  // -------------------------- Methods responsible for reading characteristics from GATT server ----------------------- //

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


  // ------------------------------ Methods for pulling data from file and sensor ---------------------------------- //

  // Used to process line from cpu temp reading
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

      setFileReadings(prevState => ({
        ...prevState,
        humidity: humidity,
        temp: temperature,
        humUpdateString: tempString,
        tempUpdateString: tempString
      }))
    }
  }

  // Used to process data recieved from cpu temp sensor
  const processSensorData = (data: any) => {
      setSensorReadings({
        cpuTemp: base64.decode(data.value)
      })
  }

  // ------------------------------ Methods for status modal ------------------------------------------------------------------ //
  // Variables needed for appmais status screen
  const [status, setStatus] = useState('red');
  const [status_modalVisible, set_status_ModalVisible] = useState<boolean>(false);

  // Sets status modal visibility
  const toggleStatusModal = () => {
    set_nan_modalVisible(!status_modalVisible);
  }

  // ---------------------------------- Remaining code is for the return, navigation, and buttons --------------------------------------- //

  // Navigates to screen with tabs variables, sensor enabling, and commands
  const goToVarScreen = () => {
    navigation.navigate('VarScreen', { deviceId: deviceId, deviceName: deviceName});
  };

  // Navigates to screen with video and audio tabs
  const goToAVScreen = () => {
    navigation.navigate('AudVidScreen', { deviceId: deviceId, deviceName: deviceName });
  }

  
  const handle_nan_ButtonPress = (data: string[], values: string[]) => {
    set_nan_modalData(data);
    set_nan_modalValues(values);
    set_nan_modalVisible(true);
  }

  const handle_close_nan_modal = () => {
    set_nan_modalVisible(false);
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.deviceButton} onPress={toggleStatusModal}>
            <Text style={styles.deviceButtonText}>AppMAIS Status</Text>
        </TouchableOpacity>
        <View style={[styles.indicator, status === 'green' && styles.green]} />
        <View style={[styles.indicator, status === 'red' && styles.red]} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>CPU</Text>
          <Text style={styles.updateDate}>{fileReadings.cpuUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>File: {fileReadings.cpuTemp}</Text>
              <Text style={styles.readingItem}>Sensor: {sensorReadings.cpuTemp}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(final_cpu_full_times, final_cpu_full_values) }>
              <View style={styles.buttonContent}>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { final_cpu_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={cpu_chartData}
          />
        </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Humidity</Text>
          <Text style={styles.updateDate}>{fileReadings.humUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>Most Recent File Reading: {fileReadings.humidity}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(final_humidity_all_times, final_humidity_full_values) }>
              <View style={styles.buttonContent}>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { final_humidity_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={humidity_chartData}
          />
        </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.graphSection}>
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Temperature</Text>
          <Text style={styles.updateDate}>{fileReadings.tempUpdateString}</Text>
          <View style={styles.textRow}>
            <View style={styles.textColumn}>
              <Text style={styles.readingItem}>File: {fileReadings.temp}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => handle_nan_ButtonPress(temperature_nans, final_temperature_all_values) }>
              <View style={styles.buttonContent}>
                <View style={styles.redDot} />
                <Text style={styles.actionButtonText}> { temperature_nan_count }</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={temperature_chartData}
          />
        </View>
        </View>
      </ScrollView>

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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
});


export default DeviceDetailScreen;
