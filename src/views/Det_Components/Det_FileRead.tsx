import base64 from 'react-native-base64';
import { Buffer } from 'buffer';
import manager from '../../bluetooth/BLEManagerSingleton';


// Service UUID and UUID's for characteristics used here.
const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
const resetCharacteristicUUID = '00000208-710e-4a5b-8d75-3e5b444bc3cf';
const CPU_SENSOR_FILE_UUID = '00000211-710e-4a5b-8d75-3e5b444bc3cf';
const HT_SENSOR_FILE_UUID = '00000212-710e-4a5b-8d75-3e5b444bc3cf';
let deviceId = '';


/**
 * This function is responsible for pulling a file from the Raspberry Pi.
 * In this case, we will be pulling csv files for the sensors.
 * 
 * @param characteristicUUID UUID of the characteristic to be read
 * @returns {String} Data read from file
 */
const perform_file_read = async (characteristicUUID: string) => {
    // Reset the offset to start at the beginning of the file
    await resetOffset();

    let combinedData = Buffer.alloc(0);
    let hasMoreChunks = true;   // true if there is more data to be read

    try {
        // While there is more data to be read
        while (hasMoreChunks) {
            // Get next chunk of data
            const chunk = await getChunk(characteristicUUID);

            if (chunk !== null) {
                // Add this chunk to the combinedData array
                combinedData = Buffer.concat([combinedData, chunk]);

                // If the current chunk's length is less than what we expect,
                // we are on the last chunk so set hasMoreChunks to false.
                const chunkSize = chunk.length;
                const expectedSize = 512;
                if (chunkSize < expectedSize) {
                    hasMoreChunks = false;
                }
            } else {
                hasMoreChunks = false
            }
        }

        // Return data collected from file.
        return (base64.decode(combinedData.toString('base64')));
    } catch (error) {
        console.log("Error occured during perform_file_read() in Det_GraphData.tsx")
    }
}


/**
 * This function is responsible for calling a characteristic on the GATT server which resets the offset for the file read.
 * This is so we make sure we are starting at the beginning of the file.
 */
const resetOffset = async () => {
    try {
        await manager.writeCharacteristicWithResponseForDevice(
            deviceId,
            serviceUUID,
            resetCharacteristicUUID,
            base64.encode('reset')
        );

        console.log('Offset reset command sent');
    } catch (error) {
        console.log('Error resetting offset on GATT server:', error);
    }
};


/**
 * This function is responsible for reading a chunk of data from the file.
 * 
 * @param characteristicUUID UUID for the characteristic of the file being read.
 * @returns Buffer containg chunk of data or null
 */
const getChunk = async (characteristicUUID: string): Promise<Buffer | null> => {
    try {
        // Read a chunk of data from the file.
        const data = await manager.readCharacteristicForDevice(
            deviceId,
            serviceUUID,
            characteristicUUID
        );

        // Decode the data and return it
        if (data.value !== null) {
            const decodedData = Buffer.from(data.value, 'base64'); // Assuming data.value is base64 encoded
            return decodedData;
        }

        // If reading the data was unsuccessful, return null.
        return null;
    } catch (error) {
        console.log('Error requesting chunk from GATT server:', error);
        return null; // Return an empty array in case of error
    }
}


/**
 * Reads sensor file from GATT server and returns an array containing each line of the read file.
 * 
 * @param {String}  device_Id   id of the connected device
 * @param {String}  file_type   Type of sensor file we are reading [cpu, ht]. (determines which characteristic is read)
 * @returns An array containing each line from the read file.
 */
const Det_GraphData = async (device_Id: string, file_type: string) => {
    deviceId = device_Id;

    if (file_type === "cpu") {
        // Call method to pull entire file of data
        const file_data = await perform_file_read(CPU_SENSOR_FILE_UUID);
        return file_data!.split('\n');
    } else if (file_type === "ht") {
        // Call method to pull entire file of data
        const file_data = await perform_file_read(HT_SENSOR_FILE_UUID);
        return file_data!.split('\n');
    }

    return [];
}


export default Det_GraphData;
