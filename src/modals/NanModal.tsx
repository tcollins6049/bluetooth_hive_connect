import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';

interface InfoModalProps {
  isVisible: boolean;
  data: string[];
  values: string[];
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isVisible, data, values, onClose }) => {
    // Function to determine the dot color based on the value
    const getDotColor = (value: string) => {
        console.log('Value received:', value); // Debugging log
        const normalizedValue = value.toLowerCase().trim(); // Normalize input
        return normalizedValue === 'nan' ? 'red' : 'green';
    };
    

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
                        <Text style={styles.title}>Information</Text>
                        {data.length > 0 ? (
                            <ScrollView contentContainerStyle={styles.listContainer}>
                                {data.map((item, index) => (
                                    <View key={index} style={styles.listItemContainer}>
                                        <View style={[styles.dot, { backgroundColor: getDotColor(values[index]) }]} />
                                        <Text style={styles.listItem}>{item}      {values[index]}</Text>
                                        {/*<Text style={styles.listItemRight}>{values[index]}</Text>*/}
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.listItem}>No nan values</Text>
                        )}
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
        // backgroundColor: 'green',
        marginRight: 10, // Add some space between the dot and the text
        marginTop: -10,
    },
});

export default InfoModal;
