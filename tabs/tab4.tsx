// Import necessary modules from React and React Native
import React, { useEffect, useState, useCallback } from 'react';
import { 
    Alert, 
    Modal, 
    Pressable, 
    View, 
    Text, 
    TextInput, 
    Button, 
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import base64 utility for encoding and decoding
import base64 from 'react-native-base64';

// Instantiate a Bluetooth manager
import manager from '../ManagerFiles/BLEManagerSingleton';

/**
 * FourthTab Component
 * @param {Object} props - Properties passed to the component
 * @param {string} props.deviceId - The ID of the BLE device
 * @param {string} props.deviceName - The name of the BLE device
 * @returns {JSX.Element} - Rendered component
 */
const FourthTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
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

    // useFocusEffect hook to fetch data whenever the tab is focused.
    useFocusEffect(
        useCallback(() => {
        fetchData();
        }, [])
    );

    /**
     * Function to fetch data from all characteristics.
     */
    const fetchData = async () => {
        // Read auto_start value for microphone
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000016-710e-4a5b-8d75-3e5b444bc3cf',
                                'audio');
        // Read auto_start value for camera
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000017-710e-4a5b-8d75-3e5b444bc3cf',
                                'video');
        // Read auto_start value for cpu
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000018-710e-4a5b-8d75-3e5b444bc3cf',
                                'temp');
        // Read auto_start value for air quality
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000019-710e-4a5b-8d75-3e5b444bc3cf',
                                'airquality');
        // Read auto_start value for scale
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000020-710e-4a5b-8d75-3e5b444bc3cf',
                                'scale');
        // Read auto_start value for cpu
        await readCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '000000021-710e-4a5b-8d75-3e5b444bc3cf',
                                'cpu');
    };

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

            const match = trimmedValue.match(/:\s*(\S+)/);
            if (match) trimmedValue = match[1];
            trimmedValue = trimmedValue.trim();
            console.log("HHHHHHHHHHHHHHHHH", trimmedValue);

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
     * Handles the submission of changes to the BLE device.
     */
    const handleSubmit = async () => {
        console.log("INSIDE HANDLESUBMIT")
        const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
        
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

            setModalVisible(true);
        } catch (error) {
            console.error("Error updating variables:", error);
        }
    };


    /**
    * Submits the changes to the BLE device by writing to the appropriate characteristics.
    */
    const submitChanges = async() => {
        console.log("INSIDE submit changes")
        // The following variables modify values for all sensors other than video
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.audio !== originalVariables.audio) {
          writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000016-710e-4a5b-8d75-3e5b444bc3cf', 
                              'audio');
        }
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.video !== originalVariables.video) {
            writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000017-710e-4a5b-8d75-3e5b444bc3cf', 
                                'video');
        }
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.temp !== originalVariables.temp) {
            writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000018-710e-4a5b-8d75-3e5b444bc3cf', 
                                'temp');
        }
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.airquality !== originalVariables.airquality) {
            writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000019-710e-4a5b-8d75-3e5b444bc3cf', 
                                'airquality');
        }
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.scale !== originalVariables.scale) {
            writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000020-710e-4a5b-8d75-3e5b444bc3cf', 
                                'scale');
        }
        // capture_window_start_time: Write to device if it has been changed.
        if (variables.cpu !== originalVariables.cpu) {
            writeCharacteristic('00000001-710e-4a5b-8d75-3e5b444bc3cf', '00000021-710e-4a5b-8d75-3e5b444bc3cf', 
                                'cpu');
        }
  
        console.log("Variables updated successfully.");

        // Wait for a short delay before fetching the data again
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        fetchData();
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sensor Management:</Text>
            <Text style={styles.instructions}>
                View and manage all connected sensors to the Raspberry Pi. 
                Customize sensor settings by enabling or disabling them.
            </Text>

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

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.submitButton, { marginRight: 10 }]} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={fetchData}>
                    <Text style={styles.submitButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>

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


type CustomSwitchProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

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

export default FourthTab;
