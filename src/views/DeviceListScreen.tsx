import React, { useEffect, useState, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    FlatList 
} from 'react-native';

import manager from '../bluetooth/BLEManagerSingleton';
import ConnectingModal from '../modals/ConnectingModal';
import ScanningModal from '../modals/ScanningModal';
import reg_devices, { DeviceInterface } from '../registered_devices';
import requestPermissions from '../bluetooth/app_permissions';
import { UUIDS } from '../constants';


/**
 * A screen containing a list of registed Raspberry Pi devices. When clicked will connect to the specified Pi.
 * Also contains a scan button in case a device has not been registered yet.
 * 
 * @param {any} navigation  
 * @returns {JSX.Element}  A screen containing a list of devices loaded from "../files/devices".
 */
const DeviceListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [connecting_modalVisible, set_connecting_modalVisible] = useState<boolean>(false);   // useState for setting connecting modal visibility
    const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);   // useState for setting scanning modal visibility

    const [currentDeviceName, setCurrentDeviceName] = useState<string>('');     // useState for setting the current device name
    const [foundDevices, setFoundDevices] = useState<DeviceInterface[]>([]);    // useState for setting list of found devices during scan

    // const [currentDevice, setCurrentDevice] = useState<DeviceInterface | null>(null);

    const isCancelled = useRef<boolean>(false);     // variable for telling if the connection process has been cancelled.


    useEffect(() => {
        /**
         * Handles permissions. (Turns on bluetooth, request permissions from user)
         */
        const subscription = manager.onStateChange((state) => {
            manager.enable();   // Turns bluetooth on
            requestPermissions()    // request permissions from user (Occurs in ../files/app_permissions.tsx)
            subscription.remove();
        }, true);
    }, []);


    /**
     * Attempt to connect to chosen device.
     * If successful, navigate to password screen, else show failure alert.
     * 
     * @param {DeviceInterface} device  Contains the fields [name: string, id: string]
     */
    const connectToDevice = async (device: DeviceInterface) => {
        // Stop scanning for devices, show the connecting modal
        manager.stopDeviceScan();
        setScanModalVisible(false);
        setCurrentDeviceName(device.name || 'Unknown Device');
        set_connecting_modalVisible(true);
        
        // setCurrentDevice(device);
        isCancelled.current = false;
  
        try {
            // Delay and check if cancel was pressed
            // await new Promise(resolve => setTimeout(resolve, 1000));
            // if (isCancelled.current) throw new Error('Connection cancelled');

            // Connect to device and discover services and characteristics attached to device
            // Addon autoConnect: true to make it constantly try reconnecting
            await manager.connectToDevice(device.id, { autoConnect: true });
            // await manager.connectToDevice(device.id);
            await manager.discoverAllServicesAndCharacteristicsForDevice(device.id);

            // await new Promise(resolve => setTimeout(resolve, 1000));
            // if (isCancelled.current) throw new Error('Connection cancelled');

            // Connection was successful, stop showing connecting modal and navigate to the next screen.
            set_connecting_modalVisible(false);
            navigation.navigate('Password', { deviceId: device.id, deviceName: device.name });
        } catch (error) {
            if (isCancelled.current) {
                console.log("Connection attempt was canceled by user")
            } else {
                console.log('Error connecting to device:', error);
                showRetryAlert(device);
                isCancelled.current = true;
            }
            set_connecting_modalVisible(false);
        }
    };
  

    /**
     * Handler method for the cancel button. Called once the cancel button within the connecting modal is pressed.
     */
    const handleCancelConnection = () => {
        isCancelled.current = true;
        set_connecting_modalVisible(false);
    };


    /**
     * If connection fails, this method is called.
     * Handles the retry alert allowing the user to either try connecting again or to cancel connection.
     * 
     * @param {DeviceInterface} device  Contains the fields [name: string, id: string]
     */
    const showRetryAlert = (device: DeviceInterface) => {
        if (!isCancelled.current) {
            Alert.alert(
                "Connection Failed",
                "Would you like to try again?",
                [
                    {
                        text: "Cancel",
                        onPress: () => console.log("Cancel Pressed"),
                        style: "cancel"
                    },
                    { text: "Retry", onPress: () => connectToDevice(device) }
                ]
            );
        }
    };


    /**
     * Scan for nearby devices advertising services within that services array.
     * Only devices advertising that service from the GATT server will detected.
     */
    const startScan = () => {
        setFoundDevices([]);    // Array of found devices
        setScanModalVisible(true);  // Scan modal shows current found devices along with a scanning icon
        const foundDeviceIds = new Set();

        // Services being scanned for. So the scan doesn't pick up devices other than Raspberry Pi's.
        const services = [
            UUIDS.SERVICE
        ];

        // Scan for devices advertising services in the services array.
        manager.startDeviceScan(services, null, (error, device) => {
            if (error) {
                console.error(error);
                setScanModalVisible(false);
                return;
            }
            // If a device has been found, add device to foundDevices array.
            if (device && !foundDeviceIds.has(device.id)) {
                foundDeviceIds.add(device.id);
                setFoundDevices(prevDevices => [...prevDevices, device as DeviceInterface]);
            }
        });
    };


    /**
     * Called when the stop button is pressed on the scanning modal. Stops the scan process.
     */
    const stopScan = () => {
        manager.stopDeviceScan();
        setScanModalVisible(false);
    };


    /**
     * Renders the passed in item (a device) within the registered device list as a button.
     * When pressed, the application will attempt a BLE connection with the selected device.
     * 
     * @param {DeviceInterface} item    Contains the fields [name: string, id: string]
     * @returns {JSX.Element}   Renderes a pressable device name list item.
     */
    const renderItem = ({ item }: { item: DeviceInterface }) => (
        <View>
            <TouchableOpacity style={styles.deviceButton} onPress={() => connectToDevice(item)}>
                <Text style={styles.deviceText}>{item.name || "Unknown Device"}</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
        </View>
    );


    /**
     * The return, this is what is rendered for this screen of the application.
     * A list of devices from the registered devices list will be rendered. Pressing one of these will attempt to connect to the device.
     * Also renders a scan button for finding devices not listed in the registered devices list.
     */
    return (
        <View style={styles.container}>
            {/* Basic title and text for the page. */}
            <Text style={styles.title}>Registered Devices:</Text>
            <Text style={styles.instructions}>
                Below is a list of registered devices. Tap on a device to connect. If connection fails, try the "Scan for Devices" button to ensure the device is advertising.
            </Text>

            {/* List of registered devices */}
            <FlatList
                data={reg_devices}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
            />

            {/* Scan button */}
            <TouchableOpacity style={styles.scanButton} onPress={startScan}>
                <Text style={styles.scanButtonText}>Scan for Devices</Text>
            </TouchableOpacity>

            {/* Modal displayed when connection if being attempted */}
            <ConnectingModal
                visible={connecting_modalVisible}
                deviceName={currentDeviceName}
                onCancel={handleCancelConnection}
            />

            {/* Modal displayed when scanning */}
            <ScanningModal
                visible={scanModalVisible}
                foundDevices={foundDevices}
                onDevicePress={connectToDevice}
                onRequestClose={stopScan}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
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
    deviceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        width: '100%',
    },
    deviceText: { fontSize: 18 },
    separator: {
        height: 1,
        backgroundColor: '#000',
        width: '100%',
        alignSelf: 'center',
    },
    scanButton: {
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
    scanButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});


export default DeviceListScreen;
