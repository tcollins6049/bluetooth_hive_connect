import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    ActivityIndicator, 
    FlatList, 
    TouchableOpacity 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { DeviceInterface } from '../registered_devices';


/**
 * Variables for the Scanning Modal
 */
interface ScanningModalProps {
    visible: boolean;   // Determines if the modal is visible
    foundDevices: DeviceInterface[];    // List of devices found during scan
    onDevicePress: (device: DeviceInterface) => void;   // Determines what happens when a device is pressed
    onRequestClose: () => void; // Determines what happens when closing the scanning modal
}


/**
 * Modal showing a scanning icon, when a device is found, it shows up within the scan list.
 * If the user presses a device in this list, the application will attempt to connect to that device.
 * If the close button is pressed then scanning is stopped and the modal is closed.
 * 
 * @param
 * @returns {JSX.Element}   Displays a scanning screen with a list of found devices.
 */
const ScanningModal: React.FC<ScanningModalProps> = ({ visible, foundDevices, onDevicePress, onRequestClose }) => {
    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onRequestClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    {/* Loading icon and scan text */}
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.text}>Scanning for devices...</Text>

                    {/* List of found devices */}
                    <FlatList
                        data={foundDevices}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.deviceButton}
                                onPress={() => onDevicePress(item)}
                            >
                                <Text style={styles.deviceText}>{item.name || "Unknown Device"}</Text>
                            </TouchableOpacity>
                        )}
                    />

                    {/* Stop Scan Button */}
                    <TouchableOpacity style={styles.stopScanButton} onPress={onRequestClose}>
                        <LinearGradient
                            colors={['#4c669f', '#3b5998', '#192f6a']}
                            style={styles.gradient}
                        >
                            <Text style={styles.stopScanButtonText}>Stop Scan</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({
    modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContainer: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10, alignItems: 'center' },
    text: { marginTop: 20, fontSize: 18 },
    stopScanButton: { marginTop: 20, width: '100%', alignItems: 'center' },
    gradient: { padding: 10, alignItems: 'center', borderRadius: 5 },
    stopScanButtonText: { color: 'white', fontSize: 18 },
    deviceButton: {
        width: '100%',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceText: { fontSize: 18 },
}); 


export default ScanningModal;
