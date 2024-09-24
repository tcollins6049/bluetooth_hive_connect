import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import base64 from 'react-native-base64';

import manager from '../files/BLEManagerSingleton';

// service UUID and characteristic UUID for password verification
const SERVICE_UUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
const PASSWORD_CHARACTERISTIC_UUID = '00000601-710e-4a5b-8d75-3e5b444bc3cf';


/**
 * A screen containing a text box for password entry and a submit button which begins the process of password verification.
 * 
 * @param {any} route
 * @param {any} navigation
 * 
 * @returns {JSX.Element}  A screen containing a text box for inputing a password and a submit button.
 */
const PasswordScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;  // id and name of device we are connected to

  const [password, setPassword] = useState(''); // Contains user entered password
  const [status, setStatus] = useState(''); // Contains the current status (password correct or incorrect)


  /**
   * Called whenever the submit button is pressed. Validates our password with the correct password contained on the device.
   * If password is correct then we go on to the device details screen.
   * 
   */
  const handlePasswordSubmit = async () => {
    try {
      // Takes password from text box and writes it to the connected device.
      const password_64 = base64.encode(password);
      await manager.writeCharacteristicWithResponseForDevice(deviceId, SERVICE_UUID, PASSWORD_CHARACTERISTIC_UUID, password_64);

      // Read returned value from device.
      const characteristic = await manager.readCharacteristicForDevice(deviceId, SERVICE_UUID, PASSWORD_CHARACTERISTIC_UUID);
      let responseValue = '0';
      if (characteristic.value) responseValue = base64.decode(characteristic.value);

      // If response is 1 then the password was correct. Navigate to the device details screen.
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


  /**
   * Return for the function, returns a screen containing a text box for password entry and a submit button.
   * 
   */
  return (
    <View style={styles.container}>
      {/* Text input for password entry */}
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.text}>{status}</Text>

      {/* Submit button for veridying entered password with device */}
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
    textAlign: 'center',
  },
});

export default PasswordScreen;
