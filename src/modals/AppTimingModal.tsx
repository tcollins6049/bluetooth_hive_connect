import React from 'react';
import { 
    View, 
    Text, 
    Modal, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions 
} from 'react-native';


interface TimingProps {
    isVisible: boolean;
    onClose: () => void;
}


/**
 * Modal used whenever AppMAIS checks occur. If an AppMAIS process is currently running, this modal is displayed letting the user know.
 * 
 * @param {boolean} isVisible   Controls if the modal is visible or not
 * @param {void}    onClose     Determines what that application does when the modals close button is pressed.
 * 
 * @returns {JSX.Element}   Displays modal saying "AppMAIS is currently running, try again later"
 */
const AppTimingModal: React.FC<TimingProps> = ({ isVisible, onClose }) => {
    return (
        <View>
            <Modal
                visible={isVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.title}>AppMAIS process is currently running, try again in 60 seconds</Text>
                        
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: Dimensions.get('window').width * 0.8,
        maxHeight: Dimensions.get('window').height * 0.6, // Adjusted height
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        alignItems: 'center'
    },
    listContainer: {
        marginBottom: 20,
    },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingVertical: 5,
    },
    listItem: {
        fontSize: 16,
        // marginVertical: 5,
        textAlign: 'left',
        marginLeft: 10,
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 14,
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
        marginTop: -10,
    },
});


export default AppTimingModal;
