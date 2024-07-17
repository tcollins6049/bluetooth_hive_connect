import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
// import { BleManager } from 'react-native-ble-plx';
import manager from '../ManagerFiles/BLEManagerSingleton';
import base64 from 'react-native-base64';


const SERVICE_UUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
const CHARACTERISTIC_UUID = '00000601-710e-4a5b-8d75-3e5b444bc3cf';
const MAX_RETRIES = 3;

const PasswordScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');


  useEffect(() => {
    connectWithRetry(MAX_RETRIES);
  }, []);


  const handlePasswordSubmit = async () => {
    try {
      const password_64 = base64.encode(password);
      await manager.writeCharacteristicWithResponseForDevice(deviceId, SERVICE_UUID, CHARACTERISTIC_UUID, password_64);

      const characteristic = await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, CHARACTERISTIC_UUID);
      let responseValue = '0';
      if (characteristic.value) responseValue = base64.decode(characteristic.value);

      // setStatus(responseValue.charCodeAt(0) === 1 ? 'Password correct' : 'Password incorrect');
      if (responseValue.charCodeAt(0) === 1) {
        setStatus('Password correct');
        navigation.navigate('DeviceDetail', { deviceId: deviceId, deviceName: deviceName });
      } else {
        setStatus('Password incorrect');
      }
  
    } catch (error) {
      console.log(error);
      setStatus('Error connecting to device');
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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.text}>{status}</Text>
      {/*<Button title="Submit" onPress={handlePasswordSubmit} />*/}
      <TouchableOpacity style={styles.submitButton} onPress={handlePasswordSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  submitButton: {
    marginTop: 20,
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    textAlign: 'center', // Optional: centers text within its own container
  },
});

export default PasswordScreen;
