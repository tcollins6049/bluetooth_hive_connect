import React from 'react';
import { View, Text, StyleSheet, Button, Modal, ActivityIndicator } from 'react-native';

interface ConnectingModalProps {
    visible: boolean;
    deviceName: string;
    onCancel: () => void;
}

const ConnectingModal: React.FC<ConnectingModalProps> = ({ visible, deviceName, onCancel }) => {
    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            onRequestClose={() => { }}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.text}>Connecting to device:</Text>
                    <Text style={styles.deviceName}>{deviceName}</Text>
                    <Button title="Cancel" onPress={onCancel} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        minWidth: 250,
    },
    text: {
        fontSize: 18,
        marginBottom: 10,
    },
    deviceName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
    },
});

export default ConnectingModal;
