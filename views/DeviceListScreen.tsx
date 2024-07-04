import React, { useEffect, useState, useRef } from 'react';
import { View, Text, PermissionsAndroid, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import manager from '../ManagerFiles/BLEManagerSingleton';
import ConnectingModal from '../files/connectingModal';
import ScanningModal from '../files/ScanningModal';
import registered_devices, { DeviceInterface } from '../files/devices';


const DeviceListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
    const [currentDeviceName, setCurrentDeviceName] = useState<string>('');
    const [foundDevices, setFoundDevices] = useState<DeviceInterface[]>([]);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [currentDevice, setCurrentDevice] = useState<DeviceInterface | null>(null);
    const isCancelled = useRef<boolean>(false);

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                requestBluetoothPermission();
                subscription.remove();
            }
        }, true);
    }, []);


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


    const connectToDevice = async (device: DeviceInterface) => {
      manager.stopDeviceScan();
      setCurrentDeviceName(device.name || 'Unknown Device');
      setModalVisible(true);
      setIsConnecting(true);
      setCurrentDevice(device);
      isCancelled.current = false;
  
      try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (isCancelled.current) throw new Error('Connection cancelled');
          await manager.connectToDevice(device.id);
  
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (isCancelled.current) throw new Error('Connection cancelled');
          setIsConnecting(false);
          setModalVisible(false);
          // navigation.navigate('DeviceDetail', { deviceId: device.id, deviceName: device.name });
          navigation.navigate('Password');
      } catch (error) {
          if (error instanceof Error && error.message === 'Connection cancelled') {
              console.log('Connection attempt cancelled');
          } else {
              console.log('Error connecting to device:', error);
              if (!isCancelled.current) {
                  showRetryAlert(device);
              }
          }
          setIsConnecting(false);
          setModalVisible(false);
      }
    };
  

    const handleCancelConnection = () => {
        isCancelled.current = true;
        setIsConnecting(false);
        setModalVisible(false);
    };


    const showRetryAlert = (device: DeviceInterface) => {
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
    };


    const startScan = () => {
        setFoundDevices([]);
        setScanModalVisible(true);
        const foundDeviceIds = new Set();

        const services = [
            '00000001-710e-4a5b-8d75-3e5b444bc3cf'
        ];
        manager.startDeviceScan(services, null, (error, device) => {
            if (error) {
                console.error(error);
                setScanModalVisible(false);
                return;
            }
            if (device && !foundDeviceIds.has(device.id)) {
                foundDeviceIds.add(device.id);
                setFoundDevices(prevDevices => [...prevDevices, device as DeviceInterface]);
            }
        });
    };


    const stopScan = () => {
        manager.stopDeviceScan();
        setScanModalVisible(false);
    };


    const renderItem = ({ item }: { item: DeviceInterface }) => (
        <View>
            <TouchableOpacity style={styles.deviceButton} onPress={() => connectToDevice(item)}>
                <Text style={styles.deviceText}>{item.name || "Unknown Device"}</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
        </View>
    );


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registered Devices:</Text>
            <Text style={styles.instructions}>
                Below is a list of registered devices. Tap on a device to connect. If connection fails, try the "Scan for Devices" button to ensure the device is advertising.
            </Text>
            <FlatList
                data={registered_devices}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
            />
            <TouchableOpacity style={styles.scanButton} onPress={startScan}>
                <Text style={styles.scanButtonText}>Scan for Devices</Text>
            </TouchableOpacity>
            <ConnectingModal
                visible={modalVisible}
                deviceName={currentDeviceName}
                onCancel={handleCancelConnection}
            />
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
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f0f0',
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
    deviceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        width: '100%',
    },
    deviceText: {
        fontSize: 18,
    },
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

