import React, { useEffect, useState } from 'react';
import { View, PermissionsAndroid, Button, Alert, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';

import manager from '../files/BLEManagerSingleton';
import StatusModal from '../modals/StatusModal';
import base64 from 'react-native-base64';

import { LineChart } from 'react-native-chart-kit';


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

  // Variables needed for appmais status screen
  const [status, setStatus] = useState('red');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Variables needed for line graph creation
  const [chartData, setChartData] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<{ label: string, value: number } | null>(null);
  const [isSelected, setIsSelected] = useState<boolean>(false);

  // Use effect specifying what happens when this screen is opened
  useEffect(() => {
    const data_start = async() => {
      requestBluetoothPermission();

      await readAndParseCpuFileData();

      // Testing
      const full_data = await readCharacteristic(serviceUUID, '00000303-710e-4a5b-8d75-3e5b444bc3cf')
      console.log("LINE DATA");
      console.log(base64.decode(full_data!.value!));

      await resetOffset();
      const line_data = await readCharacteristic(serviceUUID, '00000304-710e-4a5b-8d75-3e5b444bc3cf')
      console.log("LINE DATA");
      console.log(base64.decode(line_data!.value!));

      const line_data2 = await readCharacteristic(serviceUUID, '00000304-710e-4a5b-8d75-3e5b444bc3cf')
      console.log("LINE DATA");
      console.log(base64.decode(line_data2!.value!));

      // Read data every 5 minutes
      const intervalId = setInterval(readAndParseCpuFileData, 300000);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
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


  // Function for setting all data for file, sensor, and graph readings.
  const readAndParseCpuFileData = async () => {
    // Read full cpu file for initial cpu data
    const cpuFileData = await readCharacteristic(serviceUUID, cpu_file_UUID);
    // console.log("DATA HERE: ")
    if (cpuFileData) {
      // console.log(base64.decode(cpuFileData.value!))
      const decodedData = base64.decode(cpuFileData.value!);
      // console.log("DECODED DATA: ", decodedData);
      const parsedData = parseData(decodedData);
      // console.log("PARSED DATA: ", parsedData);
      setChartData(parsedData);


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
    }
  };

  // Gets permission to use bluetooth on phone
  const requestBluetoothPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Bluetooth Permission",
          message: "This app needs access to your device's location to use Bluetooth.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use Bluetooth");
      } else {
        console.log("Bluetooth permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };


  // ------------------------------------- Methods for graph creation ----------------------------------- //
  // Parses info from recieved file into data and labels used in graph creation
  const parseData = (fileData: string) => {
    const lines = fileData.trim().split('\n');
    const labels: string[] = [];
    const values: number[] = [];
  
    lines.forEach(line => {
      const [time, value] = line.split(',');
      if (time && value) {
        labels.push(time.substring(0, 5).replace(/"/g, '')); // Remove quotes and convert "14-00-00" to "14:00"
        values.push(parseFloat(value));
      }
    });
  
    return { labels, datasets: [{ data: values, strokeWidth: 2 }] };
  };

  // Function handling interaction of clicking point on graph and displaying point data
  const handleDataPointClick = (data: { value: number, index: number, x: number, y: number }) => {
    const { index, value, x, y } = data;
    const label = chartData.labels[index];
    setSelectedData({ label, value });
    setIsSelected(true);
  

    // Get the dimensions of the screen
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    // Calculate the position for the tooltip
    let tooltipX = x; // Adjust offset from the data point
    const tooltipY = y + 100; // Adjust vertical position as needed

    const tooltipWidth = 120;
    if (tooltipX + tooltipWidth > screenWidth) {
      tooltipX = screenWidth - tooltipWidth - 10; // Keep within screen width
    }
  
    // Set the tooltip position dynamically
    setTooltipPosition({ x: tooltipX, y: tooltipY });
  };

  // Function for closing the point data pop up
  const clearSelectedData = () => {
    setSelectedData(null);
    setIsSelected(false);
  };

  // Variable used for settings x and y position of point data pop up
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);


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

  // Sets status modal visibility
  const toggleStatusModal = () => {
    setModalVisible(!modalVisible);
  }

  // ---------------------------------- Remaining code is for the return and navigation --------------------------------------- //

  // Navigates to screen with tabs variables, sensor enabling, and commands
  const goToVarScreen = () => {
    navigation.navigate('VarScreen', { deviceId: deviceId, deviceName: deviceName});
  };

  // Navigates to screen with video and audio tabs
  const goToAVScreen = () => {
    navigation.navigate('AudVidScreen', { deviceId: deviceId, deviceName: deviceName });
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CPU</Text>
        <Text style={styles.updateDate}>{fileReadings.cpuUpdateString}</Text>
        <Text style={styles.readingItem}>File: {fileReadings.cpuTemp}</Text>
        <Text style={styles.readingItem}>Sensor: {sensorReadings.cpuTemp}</Text>
      </View>
      <View style={styles.content}>
        {chartData && (
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 16}
            height={220}
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            onDataPointClick={handleDataPointClick} // Handle click event on data points
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        )}
        {isSelected && tooltipPosition && (
          <View style={[styles.tooltip, { left: tooltipPosition.x, top: tooltipPosition.y }]}>
            <Text style={styles.tooltipText}>{`${selectedData?.label}: ${selectedData?.value}`}</Text>
            <TouchableOpacity onPress={clearSelectedData} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deviceButton} onPress={goToVarScreen}>
            <Text style={styles.deviceButtonText}>Variables</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deviceButton} onPress={goToAVScreen}>
            <Text style={styles.deviceButtonText}>Aud + Vid</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 100,
  },
  tooltipText: {
    color: '#fff',
  },
  closeButton: {
    marginTop: 5,
    padding: 5,
    backgroundColor: '#ff6347',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
  },

  section: {
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  updateDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  readingItem: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    marginLeft: 10,
  },
});


export default DeviceDetailScreen;
