import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import manager from '../files/BLEManagerSingleton';
// import disconnectBleManager from '../utils/disconnectBleManager';
import { StackNavigationProp } from '@react-navigation/stack';

interface CustomHeaderProps {
    title: string;
}



const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
    const navigation = useNavigation<StackNavigationProp<any>>();

    const handleDisconnect = async () => {
        await disconnectBleManager();
        navigation.navigate('DeviceList'); // Navigate to the first screen or any other screen
    };

    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
                <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
        </View>
    );
};


const disconnectBleManager = async () => {
    try {
        // Disconnect from all connected devices
        const connectedDevices = await manager.connectedDevices([]);
        connectedDevices.forEach(async (device) => {
            await manager.cancelDeviceConnection(device.id);
        });

        // Clean up BLE Manager
        // manager.destroy();
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
