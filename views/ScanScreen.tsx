import { View, Button, StyleSheet } from 'react-native';

/**
 * This component is responsible for the Scan view. 
 * This is the first view of the application. 
 * It displays a scan button which when pressed goes to the DeviceList screen and begins scanning for devices.
 * 
 * 
 * @param navigation - Navigation object provided by React Navigation
 */
const ScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    /**
     * Function handles the scan button press.
     * Pressing the button causes the user to be navigated to the DeviceList view.
     */
    const handleScan = () => {
      navigation.navigate('DeviceList');
    };
  
    // Render the ScanScreen UI
    return (
      <View style={styles.container}>
        <Button title="Start Scan" onPress={handleScan} />
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    variableContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 8,
      marginLeft: 10,
      flex: 1,
    },
});

export default ScanScreen;
