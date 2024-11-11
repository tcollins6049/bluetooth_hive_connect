import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    ActivityIndicator 
} from 'react-native';


/**
 * Variables used for the Loading Modal
 */
interface LoadingModalProps {
    visible: boolean;   // Determines if the modal is visible
}


/**
 * Modal used while device connection is being attempted.
 * Shows a loading icon
 * 
 * @param
 * @returns {JSX.Element}   Displays a loading icon along with a cancel connection button.
 */
const LoadingModal: React.FC<LoadingModalProps> = ({ visible }) => {
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
                    <Text style={styles.text}>Loading Image:</Text>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({
    modalBackground: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        minWidth: 250,
    },
    text: { fontSize: 18, marginBottom: 10 },
    deviceName: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
});


export default LoadingModal;
