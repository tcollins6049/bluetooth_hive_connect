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

import manager from '../../bluetooth/BLEManagerSingleton';


/**
 * Code to display a list of variables within the connected Pi's config file. We can access and change there values here.
 * 
 * @param {string} props.deviceId The ID of the connected BLE device
 * @param {string} props.deviceName The name of the connected BLE device
 * @returns {JSX.Element} Screen containing entries for each variable within the config file. Also contains a submit and refresh button.
 */
const ModificationsTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  // The service UUID and UUID's for all characteristics accessed in this file.
  const SERVICE_UUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
  const START_TIME_UUID = '00000101-710e-4a5b-8d75-3e5b444bc3cf';
  const END_TIME_UUID = '00000102-710e-4a5b-8d75-3e5b444bc3cf';
  const DURATION_UUID = '00000103-710e-4a5b-8d75-3e5b444bc3cf';
  const INTERVAL_UUID = '00000104-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_START_TIME_UUID = '00000105-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_END_TIME_UUID = '00000106-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_DURATION_UUID = '00000107-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_INTERVAL_UUID = '00000108-710e-4a5b-8d75-3e5b444bc3cf';

  // Define variables for each value we are accessing in the config file.
  type VariablesType = {
    capture_window_start_time: string;
    capture_window_end_time: string;
    capture_duration_seconds: string;
    capture_interval_seconds: string;

    v_capture_window_start_time: string;
    v_capture_window_end_time: string;
    v_capture_duration_seconds: string;
    v_capture_interval_seconds: string;
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

  // Type used to keep track of variables that have been changed.
  type ChangedVariables = {
    [key: string]: string;
  };
  // Initialize state to keep track of changed variables.
  const [changedVariables, setChangedVariables] = useState<ChangedVariables>({});

  // Initialize state used to keep track of the original variable values in order to detect changes.
  const [originalVariables, setOriginalVariables] = useState({ ...variables });
  
  // Initialize state to manage model visibility. This is the model showing the Are You Sure? Screen.
  const [modalVisible, setModalVisible] = useState(false);


  /**
   * hook which runs once the tab is opened. Calls fetchData() to get current variable values from config file.
   */
  useEffect(() => {
    fetchData();
  }, []);


  /**
   * Runs when this tab is focused. Reruns fetchData() to get variable values again.
   */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );


  /**
  * Generic function to read value from Characteristic on the Raspberry Pi. 
  * 
  * @param {string} serviceUUID UUID for the service the characteristic is under.
  * @param {string} characteristicUUID UUID of the BLE characteristic.
  * @param {string} variableName The name of the variable to update.
  */
  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string, variableName: string) => {
    try {
      // read data from given BLE characteristic.
      const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
      // console.log("Data read from the ble device: ", readData); // Uncomment to print readData to console.
  
      let base64Value = readData.value; // Extract base64 encoded value from readData
  
      if (base64Value) {
        // Decode the base64 encoded value
        let decodedValue = base64.decode(base64Value);
        // console.log("Decoded value: ", decodedValue);  // Uncomment to print read decoded value to console.
  
        // read value will look like "capt_window_start = 0800", this extracts the "0800"
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
   * Generic function to write a given value using a characteristic on the Rasberry Pi.
   * 
   * @param {string} serviceUUID UUID of the BLE service.
   * @param {string} characteristicUUID UUID of the BLE characteristic.
   * @param {string} variableName The name of the variable to write.
   */
  const writeCharacteristic = async (serviceUUID: string, characteristicUUID: string, variableName: string) => {
    try {
      // Write the updated variables to the characteristic
      if (deviceId) {
        // convert the variable value to a JSON string
        let variablesJSON = JSON.stringify((variables as {[key: string]: any})[variableName]);

        // Values end up looking like: "1200", this trims off the quotation marks.
        let trimmed = variablesJSON.replace(/"/g, '');

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
   * 
   * @param {string} variableName The name of the variable to update.
   * @param {string} value The new value to set for the variable.
   */
  const handleVariableChange = (variableName: string, value: string) => {
    // Update the state with new value for specified variable.
    setVariables(prevVariables => ({
      ...prevVariables,
      [variableName]: value
    }));
  };


  /**
   * Called when the Submit button is pressed.
   * Checks if any variables have been changed from there original values. If not then nothing happens.
   * If variables have been changed from there original values, the changedVariables array is updated accordingly.
   * Also, the Are you sure? modal is displayed.
   */
  const handleSubmit = async () => {
    try {
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
      }
    } catch (error) {
      console.error("Error updating variables:", error);
    }
  };


  /**
   * Submits the changes to the BLE device by writing to the appropriate characteristics.
   * Only performs a write if that variable was changed.
   */
  const submitChanges = () => {
    if (variables.capture_window_start_time !== originalVariables.capture_window_start_time) {  // capture_window_start_time
      writeCharacteristic(SERVICE_UUID, START_TIME_UUID, 'capture_window_start_time');
    }
    if (variables.capture_window_end_time !== originalVariables.capture_window_end_time) {  // capture_window_end_time
      writeCharacteristic(SERVICE_UUID, END_TIME_UUID, 'capture_window_end_time');
    }
    if (variables.capture_duration_seconds !== originalVariables.capture_duration_seconds) {  // capture_duration_seconds
      writeCharacteristic(SERVICE_UUID, DURATION_UUID, 'capture_duration_seconds');
    }
    if (variables.capture_interval_seconds !== originalVariables.capture_interval_seconds) {  // capture_interval_seconds
      writeCharacteristic(SERVICE_UUID, INTERVAL_UUID, 'capture_interval_seconds');
    }

    if (variables.v_capture_window_start_time !== originalVariables.v_capture_window_start_time) {  // capture_interval_seconds
      writeCharacteristic(SERVICE_UUID, VIDEO_START_TIME_UUID, 'v_capture_window_start_time');
    }
    if (variables.v_capture_window_end_time !== originalVariables.v_capture_window_end_time) {  // capture_interval_seconds
      writeCharacteristic(SERVICE_UUID, VIDEO_END_TIME_UUID, 'v_capture_window_end_time');
    }
    if (variables.v_capture_duration_seconds !== originalVariables.v_capture_duration_seconds) {  // capture_interval_seconds
      writeCharacteristic(SERVICE_UUID, VIDEO_DURATION_UUID, 'v_capture_duration_seconds');
    }
    if (variables.v_capture_interval_seconds !== originalVariables.v_capture_interval_seconds) {  // capture_interval_seconds
      writeCharacteristic(SERVICE_UUID, VIDEO_INTERVAL_UUID, 'v_capture_interval_seconds');
    }

    console.log("Variables updated successfully.");

    fetchData();
  }


  /**
   * Calls readCharacteristic for all config variables. 
   */
  const fetchData = async () => {
    // The following variables are for every sensor besides video
    await readCharacteristic(SERVICE_UUID, START_TIME_UUID, 'capture_window_start_time'); // Read for capture_window_start_time             
    await readCharacteristic(SERVICE_UUID, END_TIME_UUID, 'capture_window_end_time'); // Read for capture_window_end_time 
    await readCharacteristic(SERVICE_UUID, DURATION_UUID, 'capture_duration_seconds');  // Read for capture_duration_seconds
    await readCharacteristic(SERVICE_UUID, INTERVAL_UUID, 'capture_interval_seconds');  // Read for capture_interval_seconds

    // The following variables are only for video 
    await readCharacteristic(SERVICE_UUID, VIDEO_START_TIME_UUID, 'v_capture_window_start_time'); // Read for capture_window_start_time             
    await readCharacteristic(SERVICE_UUID, VIDEO_END_TIME_UUID, 'v_capture_window_end_time'); // Read for capture_window_end_time 
    await readCharacteristic(SERVICE_UUID, VIDEO_DURATION_UUID, 'v_capture_duration_seconds');  // Read for capture_duration_seconds
    await readCharacteristic(SERVICE_UUID, VIDEO_INTERVAL_UUID, 'v_capture_interval_seconds');  // Read for capture_interval_seconds
  };


  /**
   * The return for this screen, renders each config file variable in a list.
   * Each variable shows a text box conataining the current value.
   * Variables can be edited within the text box and by pressing submit.
   */
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
