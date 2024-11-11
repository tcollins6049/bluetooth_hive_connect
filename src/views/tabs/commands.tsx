import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import base64 from 'react-native-base64';

import manager from '../../bluetooth/BLEManagerSingleton';
import isDuringAppmais from '../../bluetooth/appmaisCheck';
import AppTimingModal from '../../modals/AppTimingModal';


/**
 * Screen containing area for command entry along with a list of quick commands.
 * Use these to run commands on the connected Raspberry Pi.
 * 
 * @param {string}  deviceId  id of the connected device
 * @param {string}  deviceName  name of the connected device
 * @returns {JSX.Element} Renders text box for command entry along with list of quick commands.
 */
const CommandsTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  // Service UUID and Command charcteristic UUID
  const SERVICE_UUID = "00000001-710e-4a5b-8d75-3e5b444bc3cf";
  const COMMAND_UUID = "00000501-710e-4a5b-8d75-3e5b444bc3cf";

  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [timing_modalVisible, set_timing_modalVisible] = useState(false);

  // List of quick commands that will be displayed.
  const quickCommands = [
    { label: 'sudo systemctl start appmais', value: 'sudo systemctl start appmais' },
    { label: 'sudo systemctl stop appmais', value: 'sudo systemctl stop appmais' },
    { label: 'sudo systemctl restart appmais', value: 'sudo systemctl restart appmais' },
    // Add more commands as needed
  ];


  /**
   * Send user entered command to be run on the Raspberry Pi.
   * 
   * @param {string}  commandToSend   Command from user contained in the text box.
   */
  const sendCommand = async (commandToSend: string) => {
    try {
      // Encode the command to base64
      const encodedCommand = base64.encode(commandToSend);

      // If appmais isn't currently recording, write the command to the Pi.
      if (!(await isDuringAppmais(deviceId, 5))) {
        // Write the command to the characteristic
        await manager.writeCharacteristicWithResponseForDevice(
          deviceId,
          SERVICE_UUID,
          COMMAND_UUID, // Use the correct characteristic UUID
          encodedCommand
        );

        console.log('Command sent successfully.');
        Alert.alert('Success', 'Command sent successfully.');
      } else {
        // Appmais process is currently running, display modal telling user to wait a bit and then try again.
        console.log("Cannot send command yet as the appmais process is running");
        set_timing_modalVisible(true);
      }
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


  /**
   * Called when the Send Command button is pressed. Shows the Are you sure? modal.
   */
  const sendCurrentCommand = () => {
    setIsModalVisible(true);
  };


  /**
   * Called after pressing "Yes" within the Are you sure? modal.
   * Sets the modal visibility to false and sends the user's entered command.
   */
  const confirmSendCommand = async () => {
    setIsModalVisible(false);
    await sendCommand(command);
    setCommand("");
  };


  /**
   * Called after pressing one of the quick commands. Sets the command text within the text box to this quick command.
   * 
   * @param {string}  command   The user's entered command
   */
  const setQuickCommand = (command: string) => {
    setCommand(command);
  };


  /**
   * Renders a text box for command entry and a clear button.
   * Also shows a list of quick commands along with a Send Command button.
   */
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header: Displays title, device id, and device name */}
        <View style={styles.header}>
          <Text style={styles.title}>Commands</Text>
          <Text>Device ID: {deviceId}</Text>
          <Text>Device Name: {deviceName || 'Unknown Device'}</Text>
          <View style={styles.horizontalLine} />
        </View>

        {/* Command entry text box */}
        <View style={styles.textboxContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              onChangeText={setCommand}
              value={command}
              placeholder="Type your command here..."
            />
            <TouchableOpacity style={styles.clearButton} onPress={() => setCommand('')}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick commands title and list */}
        <Text style={styles.quickCommandsTitle}>Quick Commands</Text>
        {quickCommands.map((item, index) => (
          <View key={index} style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => setQuickCommand(item.value)}>
              <Text style={styles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Footer: Contains the Send Command button */}
      <View style={styles.footer}>
        {/*<Button title="Send Command" onPress={sendCurrentCommand} />*/}
        <TouchableOpacity style={styles.sendButton} onPress={sendCurrentCommand}>
            <Text style={styles.sendButtonText}>Send Command</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      {/* Are you sure? Modal */}
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

      {/* AppMAIS process modal */}
      <AppTimingModal
        isVisible={timing_modalVisible}
        onClose={() => set_timing_modalVisible(false)}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  header: { flex: 1, padding: 20, backgroundColor: '#f0f0f0', alignItems: 'flex-start' },
  textboxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  horizontalLine: { borderBottomColor: 'black', borderBottomWidth: 1, width: '100%', marginVertical: 10 },
  input: { flex: 1, borderColor: 'gray', borderWidth: 1, padding: 10 },
  quickCommandsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  buttonContainer: { width: '100%', padding: 5, marginBottom: 10 },
  button: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: { color: 'black', fontSize: 16 },
  errorText: { color: 'red', marginTop: 20 },
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
  sendButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  clearButtonText: {
    color: 'gray',
    fontWeight: 'bold',
  },
});

export default CommandsTab;
