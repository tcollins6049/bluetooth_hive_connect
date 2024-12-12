import { PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';


/**
 * Requests permission for the application to access the device's local storage
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
 * Requests photo library access (iOS only).
 */
const requestPhotoLibraryPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        if (result === RESULTS.GRANTED) {
          console.log('You can use the photo library');
        } else {
          console.log('Photo library permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
};


/**
 * Requests permission for the application to use the device's bluetooth
 */
const requestBluetoothPermission = async () => {
    try {
        if (Platform.OS === 'android') {
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
        } else if (Platform.OS === 'ios') {
            const result = await request(PERMISSIONS.IOS.BLUETOOTH);
            if (result === RESULTS.GRANTED) {
                console.log('You can use Bluetooth');
            } else {
                console.log('Bluetooth permission denied');
            }
        }
    } catch (err) {
        console.warn(err);
    }
};


/**
 * Called in the application. Requests all necessary permissions.
 */
const requestPermissions = async () => {
    await requestBluetoothPermission();
    if (Platform.OS === 'android') {
        await requestExternalStoragePermission();
    } else if (Platform.OS === 'ios') {
        await requestPhotoLibraryPermission();
    }
}


export default requestPermissions;
