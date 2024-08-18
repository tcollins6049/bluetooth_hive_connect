// Import necessary modules from React and React Native
import React, { useEffect, useState, useCallback } from 'react';
import { 
    Modal, 
    Pressable, 
    View, 
    Text, 
    TextInput, 
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import base64 from 'react-native-base64';
// Instantiate a Bluetooth manager
import manager from '../../files/BLEManagerSingleton';


/**
 * FirstTab Component
 * @param {Object} props - Properties passed to the component
 * @param {string} props.deviceId - The ID of the BLE device
 * @param {string} props.deviceName - The name of the BLE device
 * @returns {JSX.Element} - Rendered component
 */
const ModificationsTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  const servUUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
  const start_time_UUID = '00000101-710e-4a5b-8d75-3e5b444bc3cf';
  const end_time_UUID = '00000102-710e-4a5b-8d75-3e5b444bc3cf';
  const duration_UUID = '00000103-710e-4a5b-8d75-3e5b444bc3cf';
  const interval_UUID = '00000104-710e-4a5b-8d75-3e5b444bc3cf';
  const v_start_time_UUID = '00000105-710e-4a5b-8d75-3e5b444bc3cf';
  const v_end_time_UUID = '00000106-710e-4a5b-8d75-3e5b444bc3cf';
  const v_duration_UUID = '00000107-710e-4a5b-8d75-3e5b444bc3cf';
  const v_interval_UUID = '00000108-710e-4a5b-8d75-3e5b444bc3cf';

  // Define the type for Variables, so we can access and change our variable values.
  type VariablesType = {
    capture_window_start_time: string;
    capture_window_end_time: string;
    capture_duration_seconds: string;
    capture_interval_seconds: string;

    v_capture_window_start_time: string;
    v_capture_window_end_time: string;
    v_capture_duration_seconds: string;
    v_capture_interval_seconds: string;
    [key: string]: string; // This is the index signature
  };

  // Define the type for ChangedVariables, so we can access changedVariables and modify values.
  type ChangedVariables = {
    [key: string]: string;
  };

  // Initialize our variables which correspond to our characteristics
  const [variables, setVariables] = useState<VariablesType>({
    capture_window_start_time: '',
    capture_window_end_time: '',
    capture_duration_seconds: '',
    capture_interval_seconds: '',
    v_capture_window_start_time: '',
    v_capture_window_end_time: '',
    v_capture_duration_seconds: '',
    v_capture_interval_seconds: ''
  });

  // Initialize state used to keep track of the original variable values in order to detect changes.
  const [originalVariables, setOriginalVariables] = useState({ ...variables });
  
  // Initialize state to manage model visibility. This is the model showing the Are You Sure? Screen.
  const [modalVisible, setModalVisible] = useState(false);
  
  // Initialize state to keep track of changed variables.
  const [changedVariables, setChangedVariables] = useState<ChangedVariables>({});


  // useEffect hook to fetch data from characteristics once this tab opens.
  useEffect(() => {
    fetchData();
  }, []);

  // useFocusEffect hook to fetch data whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );


  /**
 * Generic function to read a characteristic from a BLE device.
 * @param {string} serviceUUID - UUID of the BLE service.
 * @param {string} characteristicUUID - UUID of the BLE characteristic.
 * @param {string} variableName - The name of the variable to update.
 */
  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string, variableName: string) => {
    try {
      // Read characteristics for the deviceId and wait for completion
      const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
      console.log("Data read from the ble device: ", readData);
  
      // Extract the base64 encoded value from the read data
      let base64Value = readData.value;
      console.log("Base64 value: ", base64Value);
  
      if (base64Value) {
        // Decode the base64 encoded value
        let decodedValue = base64.decode(base64Value);
        console.log("Decoded value: ", decodedValue);
  
        // Trim whitespace from decoded value
        let trimmedValue = decodedValue.trim();

        const match = trimmedValue.match(/^\D*(\d+)\D*/);
        if (match) trimmedValue = match[1];

        // Update the state with the new value for the variable
        setVariables(prevVariables => ({
          ...prevVariables,
          [variableName]: trimmedValue
        }));

        // Also update the originalVariables as this is the original value of the characteristic.
        setOriginalVariables(prevOriginalVariables => ({
          ...prevOriginalVariables,
          [variableName]: trimmedValue
        }));
      }
    } catch (error) {
      // Log any errors that occur during the read operation.
      console.log("Error while reading data from ble device: ", error);
    }
  }

  /**
 * Generic function to write a characteristic to a BLE device.
 * @param {string} serviceUUID - UUID of the BLE service.
 * @param {string} characteristicUUID - UUID of the BLE characteristic.
 * @param {string} variableName - The name of the variable to write.
 */
  const writeCharacteristic = async (serviceUUID: string, characteristicUUID: string, variableName: string) => {
    try {
      // Check if the device is still connected
      const connectedDevices = await manager.connectedDevices([serviceUUID]);
      const isConnected = connectedDevices.some(device => device.id === deviceId);
  
      if (!isConnected) {
        console.error('Device is not connected.');
        try {
            // Attempt to reconnect to the device
            const device = await manager.connectToDevice(deviceId);
            console.log('Reconnected to device:', device.name);
        } catch (error) {
            console.error('Error reconnecting to device:', error);
            return; // Exit the function if reconnection fails
        }
      }
  
      // Write the updated variables to the characteristic
      if (deviceId) {
        // convert the variable value to a JSON string
        let variablesJSON = JSON.stringify((variables as {[key: string]: any})[variableName]);
        console.log("VARRRRR: ", variablesJSON);

        // Values end up looking like: "1200", this trims off the quotation marks.
        let trimmed = variablesJSON.replace(/"/g, '');
        console.log(trimmed);

        // Encode the trimmed value to base64
        let valueBase64 = base64.encode(trimmed);

        // Write the base64 encoded value to the characteristic.
        await manager.writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, valueBase64);
        console.log("Variables updated successfully.");
      }
    } catch (error) {
      console.error("Error updating variables:", error);
    }
  }
  

  /**
   * Handles the change of a variable's value in the state.
   * @param {string} variableName - The name of the variable to update.
   * @param {string} value - The new value to set for the variable.
   */
    const handleVariableChange = (variableName: string, value: string) => {
      // Update the state with new value for specified variable.
      setVariables(prevVariables => ({
          ...prevVariables,
          [variableName]: value
      }));
    };

  /**
 * Handles the submission of changes to the BLE device.
 */
  const handleSubmit = async () => {
    const serviceUUID = servUUID;
    
    try {
      // Check if the device is still connected
      const connectedDevices = await manager.connectedDevices([serviceUUID]);
      const isConnected = connectedDevices.some(device => device.id === deviceId);

      if (!isConnected) {
        console.error('Device is not connected.');
        try {
            // Attempt to reconnect to the device
            const device = await manager.connectToDevice(deviceId);
            console.log('Reconnected to device:', device.name);
        } catch (error) {
            console.error('Error reconnecting to device:', error);
            return; // Exit the function if reconnection fails.
        }
      }

      // Detect changes between current variables and original variables, update changedVariables
      let changes: {[key: string]: string} = {};
      for (let variable in variables) {
        if (variables[variable] !== originalVariables[variable]) {
          changes[variable] = variables[variable];
        }
      }

      // If there are changes, show the modal and set the changed variables
      if (Object.keys(changes).length > 0) {
        setChangedVariables(changes);
        setModalVisible(true);
      } else {
        // If there are no changes, just submit
        submitChanges();
      }
    } catch (error) {
      console.error("Error updating variables:", error);
    }
  };

  /**
   * Submits the changes to the BLE device by writing to the appropriate characteristics.
   */
    const submitChanges = () => {
      // The following variables modify values for all sensors other than video
      // capture_window_start_time: Write to device if it has been changed.
      if (variables.capture_window_start_time !== originalVariables.capture_window_start_time) {
        writeCharacteristic(servUUID, start_time_UUID, 'capture_window_start_time');
      }
      // capture_window_end_time: Write to device if it has been changed.
      if (variables.capture_window_end_time !== originalVariables.capture_window_end_time) {
        writeCharacteristic(servUUID, end_time_UUID, 'capture_window_end_time');
      }
      // capture_duration_seconds: Write to device if it has been changed.
      if (variables.capture_duration_seconds !== originalVariables.capture_duration_seconds) {
        writeCharacteristic(servUUID, duration_UUID, 'capture_duration_seconds');
      }
      // capture_interval_seconds: Write to device if it has been changed.
      if (variables.capture_interval_seconds !== originalVariables.capture_interval_seconds) {
        writeCharacteristic(servUUID, interval_UUID, 'capture_interval_seconds');
      }

      // The following variables modify values only for video
      // capture_interval_seconds: Write to device if it has been changed.
      if (variables.v_capture_window_start_time !== originalVariables.v_capture_window_start_time) {
        writeCharacteristic(servUUID, v_start_time_UUID, 'v_capture_window_start_time');
      }
      // capture_interval_seconds: Write to device if it has been changed.
      if (variables.v_capture_window_end_time !== originalVariables.v_capture_window_end_time) {
        writeCharacteristic(servUUID, v_end_time_UUID, 'v_capture_window_end_time');
      }
      // capture_interval_seconds: Write to device if it has been changed.
      if (variables.v_capture_duration_seconds !== originalVariables.v_capture_duration_seconds) {
        writeCharacteristic(servUUID, v_duration_UUID, 'v_capture_duration_seconds');
      }
      // capture_interval_seconds: Write to device if it has been changed.
      if (variables.v_capture_interval_seconds !== originalVariables.v_capture_interval_seconds) {
        writeCharacteristic(servUUID, v_interval_UUID, 'v_capture_interval_seconds');
      }

      console.log("Variables updated successfully.");

      fetchData();
    }

  /**
 * Function to fetch data from all characteristics.
 */
  const fetchData = async () => {
    // The following variables are for every sensor besides video
    // Read for capture_window_start_time
    await readCharacteristic(servUUID, start_time_UUID, 'capture_window_start_time');
    
    // Read for capture_window_end_time              
    await readCharacteristic(servUUID, end_time_UUID, 'capture_window_end_time');

    // Read for capture_duration_seconds
    await readCharacteristic(servUUID, duration_UUID, 'capture_duration_seconds');
                          
    // Read for capture_interval_seconds
    await readCharacteristic(servUUID, interval_UUID, 'capture_interval_seconds');

    // The following variables are only for video
    // Read for capture_window_start_time
    await readCharacteristic(servUUID, v_start_time_UUID, 'v_capture_window_start_time');
    
    // Read for capture_window_end_time              
    await readCharacteristic(servUUID, v_end_time_UUID, 'v_capture_window_end_time');

    // Read for capture_duration_seconds
    await readCharacteristic(servUUID, v_duration_UUID, 'v_capture_duration_seconds');
                          
    // Read for capture_interval_seconds
    await readCharacteristic(servUUID, v_interval_UUID, 'v_capture_interval_seconds');
  };


  return (
    <View style={styles.container}>
        {/* Header */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headContainer}>
            <Text style={styles.title}>Basic Data</Text>
            <Text>Device ID: {deviceId}</Text>
            <Text>Device Name: {deviceName || 'Unknown Device'}</Text>
            <Text style={styles.instructions}>
              Below, you can modify the variables in the Pi configuration file to customize their values.
            </Text>
          </View>

        {/* Main Content */}
        
            {/* Add some space between device info and the variables */}
            <View style={{ height: 20 }} />

            {/* All Other Sensors Section */}
            <Text style={styles.sectionTitle}>All Other Sensors</Text>
            {Object.keys(variables).filter(variableName => !variableName.startsWith('v_')).map((variableName) => (
                <View key={variableName} style={styles.variableContainer}>
                    <Text>{variableName}:</Text>
                    <TextInput
                        style={styles.input}
                        value={variables[variableName as keyof typeof variables]}
                        onChangeText={(text) => handleVariableChange(variableName, text)}
                    />
                </View>
            ))}

            {/* Video Section */}
            <Text style={styles.sectionTitle}>Video</Text>
            {Object.keys(variables).filter(variableName => variableName.startsWith('v_')).map((variableName) => (
                <View key={variableName} style={styles.variableContainer}>
                    <Text>{variableName}:</Text>
                    <TextInput
                        style={styles.input}
                        value={variables[variableName as keyof typeof variables]}
                        onChangeText={(text) => handleVariableChange(variableName, text)}
                    />
                </View>
            ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.submitButton, { marginRight: 10 }]} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={fetchData}>
                    <Text style={styles.submitButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Confirmation Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>Are you sure you want to make the following changes?</Text>
                    {Object.keys(changedVariables).map((variableName) => (
                        <Text key={variableName}>{variableName}: {changedVariables[variableName]}</Text>
                    ))}
                    {/* Confirmation Buttons */}
                    <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => {
                            setModalVisible(!modalVisible);
                            submitChanges();
                        }}
                    >
                        <Text style={styles.textStyle}>Yes</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => {
                            setModalVisible(!modalVisible);
                        }}
                    >
                        <Text style={styles.textStyle}>No</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    </View>
);
}
  

const styles = StyleSheet.create({
  headContainer: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      backgroundColor: '#f0f0f0',
      alignItems: 'flex-start',
  },
  container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
  },
  variableContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      width: '100%',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      marginLeft: 10,
      flex: 1,
      borderRadius: 5,
      backgroundColor: '#fff',
  },
  centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
  },
  modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  modalText: {
      marginBottom: 15,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
  },
  button: {
      borderRadius: 10,
      padding: 10,
      elevation: 2,
      marginTop: 10,
      width: '80%',
  },
  buttonOpen: {
      backgroundColor: '#2196F3',
  },
  buttonClose: {
      backgroundColor: '#f44336',
  },
  submitButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Set to transparent to inherit parent background
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  submitButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
  },
  textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
  },
  title: {
      fontSize: 24,
      fontWeight: 'bold',
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'left',
      width: '100%',
      paddingHorizontal: 10,
  },
  footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      backgroundColor: '#f0f0f0',
      alignItems: 'center',
  },
  buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
  },
  buttonWrapper: {
      flex: 1,
      marginHorizontal: 10,
  },
});




export default ModificationsTab;