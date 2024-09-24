import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import manager from '../files/BLEManagerSingleton';


interface CustomHeaderProps {
    title: string;
}


/**
 * Responsible for displaying a title and disconect button.
 * The disconnect button is able to disconnect from all connect devices and return the user to the DeviceList screen.
 * 
 * @param {string}  title   Title of the screen we are on
 *  
 * @returns {JSX.Element}   Displays a header containing a title and disconnect button.
 */
const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
    // Used for navigating to DeviceList screen upon disconnecting
    const navigation = useNavigation<StackNavigationProp<any>>();


    /**
     * Called when the "Disconnect" button is pressed.
     * Disconnects the BleManager and navigates to the DeviceList screen.
     * 
     */
    const handleDisconnect = async () => {
        await disconnectBleManager();
        navigation.navigate('DeviceList'); // Navigate to the first screen or any other screen
    };


    /**
     * Header for the application. 
     * Displays the page title on the left and a disconnect button on the right
     * 
     */
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
                <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
        </View>
    );
};


/**
 * Disconnects from all connected devices.
 * 
 */
const disconnectBleManager = async () => {
    try {
        // Disconnect from all connected devices
        const connectedDevices = await manager.connectedDevices([]);
        connectedDevices.forEach(async (device) => {
            await manager.cancelDeviceConnection(device.id);
        });

        console.log("BLE Manager disconnected and cleaned up.");
    } catch (error) {
        console.error("Error disconnecting BLE Manager:", error);
    }
};


const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    disconnectButton: {
        padding: 10,
        backgroundColor: '#ff0000',
        borderRadius: 5,
    },
    disconnectText: {
        color: '#ffffff',
        fontSize: 16,
    },
});

export default CustomHeader;
