import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import manager from '../ManagerFiles/BLEManagerSingleton';
import base64 from 'react-native-base64';

const FifthTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const quickCommands = [
    { label: 'sudo systemctl start appmais', value: 'sudo systemctl start appmais' },
    { label: 'sudo systemctl stop appmais', value: 'sudo systemctl stop appmais' },
    { label: 'sudo systemctl restart appmais', value: 'sudo systemctl restart appmais' },
    // Add more commands as needed
  ];

  const sendCommand = async (commandToSend: string) => {
    try {
      // Ensure the device is connected
      const connectedDevices = await manager.connectedDevices(['00000001-710e-4a5b-8d75-3e5b444bc3cf']);
      const isConnected = connectedDevices.some(device => device.id === deviceId);

      if (!isConnected) {
        console.error('Device is not connected.');
        try {
          // Attempt to reconnect to the device
          const device = await manager.connectToDevice(deviceId);
          console.log('Reconnected to device:', device.name);
        } catch (reconnectError) {
          console.error('Error reconnecting to device:', reconnectError);
          setError('Failed to reconnect to device.');
          return;
        }
      }

      // Encode the command to base64
      const encodedCommand = base64.encode(commandToSend);

      // Write the command to the characteristic
      await manager.writeCharacteristicWithResponseForDevice(
        deviceId,
        '00000001-710e-4a5b-8d75-3e5b444bc3cf',
        '00000023-710e-4a5b-8d75-3e5b444bc3cf', // Use the correct characteristic UUID
        encodedCommand
      );

      console.log('Command sent successfully.');
      Alert.alert('Success', 'Command sent successfully.');
    } catch (writeError) {
      console.error('Error sending command:', writeError);

      let errorMessage = 'Failed to send command.';

      // Type narrowing to check if writeError has a message property
      if (writeError instanceof Error) {
        // If error message matches 'Operation was rejected' but command was executed, treat it as success
        if (writeError.message.includes('Operation was rejected')) {
          console.log('Operation was rejected error ignored.');
          Alert.alert('Success', 'Command sent successfully (despite the rejection).');
          return; // Early return to avoid setting error state
        } else {
          errorMessage = writeError.message;
        }
      }

      setError(errorMessage);
      Alert.alert('Error', 'Command couldn\'t be sent, please try again.');
    }
  };

  const sendCurrentCommand = () => {
    setIsModalVisible(true);
  };

  const confirmSendCommand = async () => {
    setIsModalVisible(false);
    await sendCommand(command);
  };

  const sendQuickCommand = (command: string) => {
    setCommand(command);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Commands</Text>
          <Text>Device ID: {deviceId}</Text>
          <Text>Device Name: {deviceName || 'Unknown Device'}</Text>
          <View style={styles.horizontalLine} />
        </View>

        <View style={styles.textboxContainer}>
          <TextInput
            style={styles.input}
            onChangeText={setCommand}
            value={command}
            placeholder="Type your command here..."
          />
        </View>

        <Text style={styles.quickCommandsTitle}>Quick Commands</Text>


        {quickCommands.map((item, index) => (
          <View key={index} style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => sendQuickCommand(item.value)}>
              <Text style={styles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {/*<Button title="Send Command" onPress={sendCurrentCommand} />*/}
        <TouchableOpacity style={styles.sendButton} onPress={sendCurrentCommand}>
            <Text style={styles.sendButtonText}>Send Command</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      <Modal
        transparent={true}
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to send the command '{command}'?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={confirmSendCommand}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'flex-start'
  },
  textboxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  horizontalLine: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    width: '100%', // Adjust the width as needed
    marginVertical: 10, // Adjust the vertical margin as needed
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  quickCommandsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    padding: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 20,
  },
  sendButton: {
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
  sendButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default FifthTab;
