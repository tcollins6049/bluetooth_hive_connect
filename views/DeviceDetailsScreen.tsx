import React, { useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { View, PermissionsAndroid, Button, Alert } from 'react-native';

import manager from '../ManagerFiles/BLEManagerSingleton';

// Number of connection attempts
const MAX_RETRIES = 3;

const DeviceDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;

  useEffect(() => {
    requestBluetoothPermission().then(() => connectWithRetry(MAX_RETRIES));
  }, []);


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

  const connect = async () => {
    try {
      if (deviceId) {
        const device = await manager.connectToDevice(deviceId, { autoConnect: true });
        console.log('Connected to device:', device.name);

        // Discover all services and characteristics
        const discoveredDevice = await manager.discoverAllServicesAndCharacteristicsForDevice(device.id);
        // console.log('Discovered services and characteristics:', discoveredDevice);
        
        const discoveredServices = await discoveredDevice.services();
        discoveredServices.forEach(service => {
          console.log(`Service UUID: ${service.uuid}`);
        });

        return true;
      }
    } catch (error) {
      // console.error('Error connecting to device: ', error);
      return false;
    }
  };


  // Function to retry connection a specified number of times
  const connectWithRetry = async (retries: number) => {
    for (let i = 0; i < retries; i++) {
      const connected = await connect();
      if (connected) return;
      console.log(`Retrying connection (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
    }
    Alert.alert("Connection Failed", "Unable to connect to the device after multiple attempts.");
  };


  const goToFourthScreen = () => {
    navigation.navigate('FourthScreen', { deviceId: deviceId, deviceName: deviceName});
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Device Details" onPress={goToFourthScreen} />
    </View>
  );
};

export default DeviceDetailScreen;
