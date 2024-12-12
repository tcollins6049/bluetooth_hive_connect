import React, { useState, useCallback } from 'react';
import {  
    Modal, 
    Pressable, 
    View, 
    Text, 
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import base64 from 'react-native-base64';

import manager from '../../bluetooth/BLEManagerSingleton';
import { UUIDS } from '../../constants';


/**
 * A screen containing a list of sensors along with on/off buttons. Here you can select which sensors you want enabled or disabled.
 * Press the submit button to apply changes or refresh to see current sensor states.
 * 
 * @param {string} deviceId The ID of the BLE device
 * @param {string} deviceName The name of the BLE device
 * 
 * @returns {JSX.Element} - Rendered screen displaying a list of sensors with buttons to turn them off or on.
 */
const SensorsTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
    // Service UUID and UUID's for each characteristic used on this screen.
    // const SERVICE_UUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
    // const MIC_UUID = '00000401-710e-4a5b-8d75-3e5b444bc3cf';
    // const CAMERA_UUID = '00000402-710e-4a5b-8d75-3e5b444bc3cf';
    // const TEMP_UUID = '00000403-710e-4a5b-8d75-3e5b444bc3cf';
    // const AIRQUALITY_UUID = '00000404-710e-4a5b-8d75-3e5b444bc3cf';
    // const SCALE_UUID = '00000405-710e-4a5b-8d75-3e5b444bc3cf';
    // const CPU_UUID = '00000406-710e-4a5b-8d75-3e5b444bc3cf';

    // Define the type for Variables, so we can access and change our variable values.
    type VariablesType = {
        audio: boolean;
        video: boolean;
        temp: boolean;
        airquality: boolean;
        scale: boolean;
        cpu: boolean;
        [key: string]: boolean; // This is the index signature
    };

    // Initialize our variables which correspond to our characteristics
    const [variables, setVariables] = useState<VariablesType>({
        audio: false,
        video: false,
        temp: false,
        airquality: false,
        scale: false,
        cpu: false
    });

    // Initialize state to manage modal visibility. This is the modal showing the Are You Sure? Screen.
    const [modalVisible, setModalVisible] = useState(false);

    // Initialize state used to keep track of the original variable values in order to detect changes.
    const [originalVariables, setOriginalVariables] = useState({ ...variables });

    /**
     * Runs when this tab is focused. Runs fetchData() to get variable values again.
     */
    useFocusEffect(
        useCallback(() => {
        fetchData();
        }, [])
    );


    /**
     * Calls readCharacteristic for each sensor to get there original values.
     * 
     */
    const fetchData = async () => {
        await readCharacteristic(UUIDS.SERVICE, UUIDS.MIC_CHAR, 'audio');
        await readCharacteristic(UUIDS.SERVICE, UUIDS.CAMERA_CHAR, 'video');
        await readCharacteristic(UUIDS.SERVICE, UUIDS.TEMP_CHAR, 'temp');
        await readCharacteristic(UUIDS.SERVICE, UUIDS.AIRQUALITY_CHAR, 'airquality');
        await readCharacteristic(UUIDS.SERVICE, UUIDS.SCALE_CHAR, 'scale');
        await readCharacteristic(UUIDS.SERVICE, UUIDS.CPU_CHAR, 'cpu');
    };


    /**
     * Read characteristic from Raspberry Pi. Here we are reading the value "true/false" for each sensor.
     * 
     * @param {string} serviceUUID UUID of the BLE service.
     * @param {string} characteristicUUID UUID of the BLE characteristic.
     * @param {string} variableName The name of the variable to update.
     */
    const readCharacteristic = async (serviceUUID: string, characteristicUUID: string, variableName: string) => {
        try {
            // Read characteristics for the deviceId and wait for completion
            const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
            // console.log("Data read from the ble device: ", readData);
        
            let base64Value = readData.value;   // Extract the base64 encoded value from the read data
        
            if (base64Value) {
                // Decode the base64 encoded value
                let decodedValue = base64.decode(base64Value);
        
                // read value will look like "auto_start = true", here we extract the "true".
                let trimmedValue = decodedValue.trim();
                const match = trimmedValue.match(/:\s*(\S+)/);
                if (match) trimmedValue = match[1];
                trimmedValue = trimmedValue.trim();

                // Convert 'True'/'False' string to boolean
                let booleanValue = trimmedValue.toLowerCase() === 'true';

                // Update the state with the new value for the variable
                setVariables(prevVariables => ({
                ...prevVariables,
                [variableName]: booleanValue
                }));

                // Also update the originalVariables as this is the original value of the characteristic.
                setOriginalVariables(prevOriginalVariables => ({
                ...prevOriginalVariables,
                [variableName]: booleanValue
                }));
            }
        } catch (error) {
            // Log any errors that occur during the read operation.
            console.log("Error while reading data from ble device: ", error);
        }
    }


    /**
     * Generic function to write a characteristic to a Raspberry Pi.
     * 
     * @param {string} serviceUUID  UUID of the BLE service.
     * @param {string} characteristicUUID   UUID of the BLE characteristic.
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
     * Called when the Submit button is pressed. Shows the submission modal.
     * 
     */
    const handleSubmit = async () => {
        try {
            setModalVisible(true);
        } catch (error) {
            console.error("Error updating variables:", error);
        }
    };


    /**
    * Writes values that have been changed to the device.
    * 
    */
    const submitChanges = async() => {
        if (variables.audio !== originalVariables.audio) {
          writeCharacteristic(UUIDS.SERVICE, UUIDS.MIC_CHAR, 'audio');
        }
        if (variables.video !== originalVariables.video) {
            writeCharacteristic(UUIDS.SERVICE, UUIDS.CAMERA_CHAR, 'video');
        }
        if (variables.temp !== originalVariables.temp) {
            writeCharacteristic(UUIDS.SERVICE, UUIDS.TEMP_CHAR, 'temp');
        }
        if (variables.airquality !== originalVariables.airquality) {
            writeCharacteristic(UUIDS.SERVICE, UUIDS.AIRQUALITY_CHAR, 'airquality');
        }
        if (variables.scale !== originalVariables.scale) {
            writeCharacteristic(UUIDS.SERVICE, UUIDS.SCALE_CHAR, 'scale');
        }
        if (variables.cpu !== originalVariables.cpu) {
            writeCharacteristic(UUIDS.SERVICE, UUIDS.CPU_CHAR, 'cpu');
        }
  
        console.log("Variables updated successfully.");

        // Wait for a short delay before fetching the data again
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        fetchData();
    };


    /**
     * Renders a list of sensors with on/off switches along with a Submit and Refresh button.
     * 
     */
    return (
        <View style={styles.container}>
            <ScrollView>
                {/* Displays title and screen description */}
                <Text style={styles.title}>Sensor Management:</Text>
                <Text style={styles.instructions}>
                    View and manage all connected sensors to the Raspberry Pi. 
                    Customize sensor settings by enabling or disabling them.
                </Text>

                {/* List of sensor switches */}
                <CustomSwitch
                    label="Microphone"
                    value={variables.audio}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, audio: value }))}
                />
                <CustomSwitch
                    label="Camera"
                    value={variables.video}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, video: value }))}
                />
                <CustomSwitch
                    label="Thermometer"
                    value={variables.temp}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, temp: value }))}
                />
                <CustomSwitch
                    label="Air Quality"
                    value={variables.airquality}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, airquality: value }))}
                />
                <CustomSwitch
                    label="Scale"
                    value={variables.scale}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, scale: value }))}
                />
                <CustomSwitch
                    label="CPU"
                    value={variables.cpu}
                    onValueChange={(value) => setVariables(prevVariables => ({ ...prevVariables, cpu: value }))}
                />
            </ScrollView>

            {/* Submit and Refresh buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.submitButton, { marginRight: 10 }]} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={fetchData}>
                    <Text style={styles.submitButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* Submission Modal */}
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
                        <Text style={styles.modalText}>Are you sure you want to submit the changes?</Text>
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
                            onPress={() => setModalVisible(!modalVisible)}
                        >
                            <Text style={styles.textStyle}>No</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}


/**
 * Declaring props to include in the CustomSwitch component.
 * 
 */
type CustomSwitchProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};


/**
 * Component for rendering a sensor list item and switch
 * 
 * @param {string}  label   The sensor label to display in the sensor list item
 * @param {boolean} value   Current state of the sensor (0n/off)
 * @param onValueChange     Function for action performed if the switch is pressed
 * 
 * @returns {JSX.Element}   List item containg the sensor label and on/off switch.
 */
const CustomSwitch: React.FC<CustomSwitchProps> = ({ label, value, onValueChange }) => {
    return (
        <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <TouchableOpacity
                style={[styles.switch, value ? styles.switchOn : styles.switchOff]}
                onPress={() => onValueChange(!value)}
            >
                <Text style={styles.switchText}>{value ? 'On' : 'Off'}</Text>
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    instructions: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#FFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: '100%',
    },
    toggleLabel: {
        flex: 1,
        fontSize: 16,
    },
    switch: {
        width: 60,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#808080',
    },
    switchText: {
        fontSize: 14,
        color: '#808080',
    },
    switchOn: {
        backgroundColor: '#D8E8D6', // Dull green color for "on" state
        borderColor: '#D8E8D6',
    },
    switchOff: {
        backgroundColor: '#E0E0E0',
        borderColor: '#E0E0E0',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Align buttons in the center horizontally
        marginTop: 20,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#2196F3",
        marginTop: 10
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
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
});

export default SensorsTab;
