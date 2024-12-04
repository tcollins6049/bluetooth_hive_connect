import React from 'react';
import { 
    View, 
    Text, 
    Modal, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    ScrollView 
} from 'react-native';
import { DataTable } from 'react-native-paper';


/**
 * Variables for the Info Modal
 */
interface InfoModalProps {
  isVisible: boolean;   // Determines if the modal is visible
  data: string[];   // Graph labels (recording times)
  values: string[]; // Graph values (Value recorded)
  interpolated_indeces: number[];   // List of indeces where points were interpolated
  failures: number; // Amount of failures (>= 3 nans in a row)
  nan_count: number;    // Amount of nan recordings
  onClose: () => void;  // What to do when close is pressed
}


/**
 * Modal contains labels on the left side of the screen with there corresponding values on the right.
 * Displays the time of recording along with the value that was recorded.
 * Also displays a red or green dot giving a visual indication if a nan value was recorded or not, Yellow dot if a point was interpolated.
 * Displays failure and nan count at the top. Failure count is how many times 3 or more nan values were recorded in a row.
 * 
 * @param 
 * @returns {JSX.Element}   Modal containing a list of labels and corresponding values.
 */
const InfoModal: React.FC<InfoModalProps> = ({ isVisible, data, values, interpolated_indeces, failures, nan_count, onClose }) => {
    /**
     * Used to determine the dot color based on the value.
     * If nan: red, If interpolated: yellow, else: green.
     * 
     * @param {string}  value   Value of the point a color is being assigned to.
     * @returns {string} Assigned color, either red. yellow, or green.
     */
    const getDotColor = (value: string, index: number) => {
        console.log('Value received:', value); // Debugging log
        const normalizedValue = value.toLowerCase().trim(); // Normalize input

        for (let i = 0; i < interpolated_indeces.length; i++) {
            if (interpolated_indeces[i] == index) {
                return 'yellow';
            }
        }
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
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>

                        <Text>Failures: { failures }</Text>
                        <Text>Nan Count: { nan_count }</Text>
                        <DataTable style={styles.container}> 
                            {/* Table Header */}
                            <DataTable.Header style={styles.tableHeader}> 
                                <DataTable.Title>   </DataTable.Title> 
                                <DataTable.Title>Time</DataTable.Title> 
                                <DataTable.Title>Value</DataTable.Title> 
                            </DataTable.Header> 

                            {/* Table Contents [dot, label, value] */}
                            <ScrollView 
                                contentContainerStyle={styles.listContainer}
                                style={{ maxHeight: Dimensions.get('window').height * 0.5 }}
                            >
                                {values.map((item, index) => (
                                    <DataTable.Row key={index}> 
                                        <DataTable.Cell><View style={[styles.dot, { backgroundColor: getDotColor(values[index], index) }]} /></DataTable.Cell> 
                                        <DataTable.Cell>{ data[index] }</DataTable.Cell> 
                                        <DataTable.Cell>{ values[index] }</DataTable.Cell> 
                                    </DataTable.Row> 
                                ))}
                            </ScrollView>

                        </DataTable>
                    </View>
                </View>
            </Modal>
        </View>
      ); 
};


const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContainer: {
        width: Dimensions.get('window').width * 0.8,
        maxHeight: Dimensions.get('window').height * 0.7, // Adjusted height
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    listContainer: { marginBottom: 20 },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingVertical: 5,
    },
    listItem: { fontSize: 16, textAlign: 'left', marginLeft: 10 },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1, // Ensure it is above the modal content
        padding: 5,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#333', // Dark gray color
        fontWeight: 'bold',
    },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10, marginTop: -10 },
    container: { padding: 15 }, 
    tableHeader: { backgroundColor: '#DCDCDC' }, 
});


export default InfoModal;
