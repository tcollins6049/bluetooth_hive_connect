import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
// import { BleManager } from 'react-native-ble-plx';
import manager from '../ManagerFiles/BLEManagerSingleton';


const SERVICE_UUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
const CHARACTERISTIC_UUID = '00000601-710e-4a5b-8d75-3e5b444bc3cf';

const PasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handlePasswordSubmit = async () => {
    try {
      const device = await manager.connectToDevice('your-device-id');
      await device.discoverAllServicesAndCharacteristics();
      
      const services = await device.services();
      let characteristic;

      for (const service of services) {
        if (service.uuid === SERVICE_UUID) {
          const characteristics = await service.characteristics();
          characteristic = characteristics.find(c => c.uuid === CHARACTERISTIC_UUID);
          break;
        }
      }

      if (!characteristic) {
        throw new Error('Characteristic not found');
      }

      await characteristic.writeWithResponse(password);

      const response = await characteristic.read();
      let responseValue = '0';
      if (response.value) responseValue = response.value[0]; // 1 for correct, 0 for incorrect

      setStatus(responseValue === '1' ? 'Password correct' : 'Password incorrect');
    } catch (error) {
      console.log(error);
      setStatus('Error connecting to device');
    }
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
      <Button title="Submit" onPress={handlePasswordSubmit} />
      <Text>{status}</Text>
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
});

export default PasswordScreen;
