import { PermissionsAndroid, Platform } from 'react-native';


/**
 * Requests permission for the application to access the device's local storage
 * 
 */
const requestExternalStoragePermission = async () => {
    try {
    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
        title: "Storage Permission",
        message: "This app needs access to your storage to save files",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
        }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the storage");
    } else {
        console.log("Storage permission denied");
    }
    } catch (err) {
    console.warn(err);
    }
};


/**
 * Requests permission for the application to use the device's bluetooth
 * 
 */
const requestBluetoothPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Bluetooth Permission",
                message: "This app needs access to your device's location to use Bluetooth.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
            }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("You can use Bluetooth");
        } else {
            console.log("Bluetooth permission denied");
        }
    } catch (err) {
        console.warn(err);
    }
};


/**
 * Called in the application. Requests all necessary permissions.
 * 
 */
const requestPermissions = async () => {
    requestBluetoothPermission();
    if (Platform.OS === 'android') {
        requestExternalStoragePermission();
    }
}

export default requestPermissions;
