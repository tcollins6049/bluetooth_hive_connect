import React from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Modal, 
  ModalProps 
} from 'react-native';


interface StatusModalProps extends ModalProps {
  visible: boolean;
  onClose: () => void;
}


/**
 * 
 * 
 * @param {boolean} visible Determines if the modal is visible or not
 * @param {}        onClose Determines what happens when the close button is pressed 
 * 
 * @returns {JSX.Element}
 */
const StatusModal: React.FC<StatusModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>This is the AppMAIS status information.</Text>
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
});

export default StatusModal;
