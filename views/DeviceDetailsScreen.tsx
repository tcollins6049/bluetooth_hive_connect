/*import React, { useEffect, useState } from 'react';
import { View, PermissionsAndroid, Button, Alert, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';

import manager from '../ManagerFiles/BLEManagerSingleton';
import StatusModal from '../files/StatusModal';
import base64 from 'react-native-base64';

import { LineChart } from 'react-native-chart-kit';


const generateSampleData = () => {
  return {
    labels: ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00'],
    datasets: [
      {
        data: [30, 45, 35, 55, 40, 70, 65, 85, 75, 60, 50, 90],
        strokeWidth: 2, // optional
      },
    ],
  };
};


const DeviceDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
  const cpu_file_UUID = '00000303-710e-4a5b-8d75-3e5b444bc3cf';

  const { deviceId, deviceName } = route.params;
  const [status, setStatus] = useState('red');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const sampleData = generateSampleData();

  const tempData = [
    { time: "14-15-00", value: 117.88 },
    { time: "14-20-00", value: 122.26 },
    { time: "14-25-00", value: 124.89 },
    { time: "14-30-00", value: 124.89 },
    { time: "14-35-00", value: 124.02 },
    { time: "14-40-00", value: 125.77 },
    { time: "14-45-00", value: 126.65 },
    { time: "14-50-00", value: 124.89 },
    { time: "14-55-00", value: 126.65 },
    { time: "15-00-00", value: 125.77 },
    { time: "15-05-00", value: 125.77 },
    { time: "15-10-00", value: 126.65 }
  ];


  useEffect(() => {
    const data_start = async() => {
      requestBluetoothPermission();


      // Read full cpu file for initial cpu data
      const cpuFileData = await readCharacteristic(serviceUUID, cpu_file_UUID);
      console.log("DATA HERE: ")
      if (cpuFileData) {
        console.log(base64.decode(cpuFileData.value!))
      }
    }

    data_start();

    //const interval = setInterval(() => {
    //  addNewValue();
    //}, 60000);
    //return () => clearInterval(interval); // Cleanup on unmount
  }, []);


  // ------------------------------------- Testing Section: Getting all data from file for initial graph ----------------------------------- //
  

  // ---------------------------------------------------------------------------------------------------------------------------------------- //


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


  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
    try {
        const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
        return readData;
    } catch (error) {
        console.log("Error while reading data from ble device: ", error);
        return null;
    }
  }

  const goToVarScreen = () => {
    navigation.navigate('VarScreen', { deviceId: deviceId, deviceName: deviceName});
  };

  const goToAVScreen = () => {
    navigation.navigate('AudVidScreen', { deviceId: deviceId, deviceName: deviceName });
  }

  const toggleStatusModal = () => {
    setModalVisible(!modalVisible);
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
      <View style={styles.content}>
        <LineChart
          data={sampleData}
          width={Dimensions.get('window').width - 16} // Adjusting width to fit within the screen
          height={220}
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726'
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
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
});


export default DeviceDetailScreen;*/


import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const SimpleLineChart = () => {
  const sampleData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        strokeWidth: 2, // optional
      },
    ],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={sampleData}
        width={Dimensions.get('window').width - 16} // Adjusting width to fit within the screen
        height={220}
        chartConfig={{
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
          decimalPlaces: 2, // optional, defaults to 2dp
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726'
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default SimpleLineChart;

