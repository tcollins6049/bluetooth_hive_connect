import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  Image,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import base64 from 'react-native-base64';
import manager from '../../files/BLEManagerSingleton';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import isDuringAppmais from '../../files/appmaisCheck';

import LineGraph from '../../modals/Line_graph';


const VideoTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
  const videoFileInfoUUID = '00000202-710e-4a5b-8d75-3e5b444bc3cf';
  const videoCharacteristicUUID = '00000203-710e-4a5b-8d75-3e5b444bc3cf';
  const FresetCharacteristicUUID = '00000204-710e-4a5b-8d75-3e5b444bc3cf';
  const staticCharacteristicUUID = '00000207-710e-4a5b-8d75-3e5b444bc3cf';
  const SresetCharacteristicUUID = '00000208-710e-4a5b-8d75-3e5b444bc3cf';

  const [videoImagePath, setVideoImagePath] = useState('');

  const [videoFileSize, setVideoFileSize] = useState<string>("No File Found");
  const [videoDate, setVideoDate] = useState<string>("No File Found");

  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImageUrl, setPopupImageUrl] = useState('');

  
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestExternalStoragePermission();
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {

      const initial = async () => {
        // Fetch the file when the tab is focused
        await readFileInfoCharacteristic(serviceUUID, videoFileInfoUUID, 'video');
        await get_cpu_graph_data();

        isDuringAppmais(deviceId);
      }

      initial();
    }, [])
  );
  

  /**
   * This method requests permission from the device to access storage.
   * // Probably needs to be moved to a different file //
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
   * @param serviceUUID -- UUID of the service which the characteristic is a part of
   * @param characteristicUUID -- UUID of the characteristic we are reading
   * @param fileVariable -- This will be either 'audio' or 'video'
   * 
   * This method is responsible for reading the characteristic which gets the file size of the most recent audio or video file.
   */
  const readFileInfoCharacteristic = async (serviceUUID: string, characteristicUUID: string, fileVariable: string) => {
    try {
      // Read characteristics for the deviceId and wait for completion
      const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
  
      // Extract the base64 encoded value from the read data
      let base64Value = readData.value;
  
      if (base64Value) {
        // Decode the base64 encoded value
        let decodedValue = base64.decode(base64Value);
        if (fileVariable === 'video') {
          const decoded_fileSize = decodedValue.split(', ')[1]
          const decoded_filePath = decodedValue.split(', ')[0]

          setVideoDate(extractCreationDate(decoded_filePath))
          formatFileSize(decoded_fileSize, setVideoFileSize)
        }
        console.log("The value: ", decodedValue);
      }
    } catch (error) {
      // Log any errors that occur during the read operation.
      console.log("Error while reading data from ble device: ", error);
    }
  }


  const extractCreationDate = (filePath: string): string => {
    const pattern = /@(\d{4}-\d{2}-\d{2})@(\d{2}-\d{2}-\d{2})\./;
    const match = filePath.match(pattern);

    if (match) {
      const date_str = match[1];
      const time_str = match[2];

      const [hours, minutes, seconds] = time_str.split('-').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(seconds);

      const time_format = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).toLowerCase();

      const creationDate = `${date_str} at ${time_format}`;
      return creationDate
    } else {
      return "No Match Found";
    }
  }


  const formatFileSize = (currSize: string, setSize: React.Dispatch<React.SetStateAction<string>>) => {
    const match = currSize.match(/(\d+)/);
    const bytes = match ? parseInt(match[0], 10) : 0;
    
    const kilobytes = bytes / 1024;
    const megabytes = bytes / (1024 ** 2);
    const gigabytes = bytes / (1024 ** 3);
  
    if (gigabytes >= 1) {
      setSize(`${gigabytes.toFixed(2)} GB`);
    } else if (megabytes >= 1) {
      setSize(`${megabytes.toFixed(2)} MB`);
    } else if (kilobytes >= 1) {
      setSize(`${kilobytes.toFixed(2)} KB`);
    } else {
      setSize(`${bytes} bytes`);
    }
  };


  // ---------------- Methods in this section are responsible for sending command for taking picture -------------------- //
  const handlePicture = async () => {
    try {
        await sendCommand('libcamera-still -o picture.jpg') // Take picture
        await fetchFile(serviceUUID, staticCharacteristicUUID, SresetCharacteristicUUID, 'video_frame.jpg', setVideoImagePath); // Fetch picture
        setShowImagePopup(true);
    } catch (error) {
        console.log('Error fetching file:', error);
    }
  };


  const sendCommand = async (commandToSend: string) => {
    try {
      // Ensure the device is connected
      const connectedDevices = await manager.connectedDevices(['00000001-710e-4a5b-8d75-3e5b444bc3cf']);
      const isConnected = connectedDevices.some(device => device.id === deviceId);

      if (!isConnected) {
        console.error('Device is not connected.');
        try {
          // Attempt to reconnect to the device
          const device = await manager.connectToDevice(deviceId);
          console.log('Reconnected to device:', device.name);
        } catch (reconnectError) {
          console.log('Error reconnecting to device:', reconnectError);
        }
      }

      // Encode the command to base64
      const encodedCommand = base64.encode(commandToSend);

      // Write the command to the characteristic
      await manager.writeCharacteristicWithResponseForDevice(
        deviceId,
        '00000001-710e-4a5b-8d75-3e5b444bc3cf',
        '00000023-710e-4a5b-8d75-3e5b444bc3cf', // Use the correct characteristic UUID
        encodedCommand
      );

      console.log('Command sent successfully.');
      // Alert.alert('Success', 'Command sent successfully.');
    } catch (writeError) {
      console.log('Error sending command:', writeError);

      let errorMessage = 'Failed to send command.';

      // Type narrowing to check if writeError has a message property
      if (writeError instanceof Error) {
        // If error message matches 'Operation was rejected' but command was executed, treat it as success
        if (writeError instanceof Error && writeError.message.includes('Operation was rejected')) {
          console.log('Operation was rejected error ignored.');
          // Alert.alert('Success', 'Command sent successfully (despite the rejection).');
        } else {
          errorMessage = writeError.message;
        }
      }

      // Alert.alert('Error', 'Command couldn\'t be sent, please try again.');
      // throw writeError;
    }
  };


  // ---------------- Parts below here correspond to file transfers and don't need to be touched. ----------------------- //
  /**
   * @returns -- A 512 byte chunk of data from a file
   * 
   * This method is responsible for reading a single chunk of a data from a file on the Raspberry Pi.
   * This is a part of the file transfer process. 512 bytes will be read at a time.
   */
  const getChunk = async (serviceUUID: string, characteristicUUID: string): Promise<Buffer | null> => {
    try {

      const data = await manager.readCharacteristicForDevice(
        deviceId,
        serviceUUID,
        characteristicUUID
      );

      // Decode value
      if (data.value !== null) {
        const decodedData = Buffer.from(data.value, 'base64'); // Assuming data.value is base64 encoded
  
        // console.log(decodedData);
        return decodedData;
      }

      return null;
    } catch (error) {
      console.log('Error requesting chunk from GATT server:', error);
      return null; // Return an empty array in case of error
    }
  }


  /**
   * This method calls a characteristic on the GATT server which resets the offset within the file transfer characteristic.
   * The offset is used to determine what chunk we are reading.
   */
  const resetOffset = async (serviceUUID: string, resetCharacteristicUUID: string) => {
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
   * This is like the main method for the file transfer process.
   * This method loops through each chunk of file data, pulls the chunk of data from the pi, and then concatenates them and sends them to saveToFile()
   */
  const fetchFile = async (serviceUUID: string, characteristicUUID: string, resetCharacteristicUUID: string, file_name: string, setImagePath: React.Dispatch<React.SetStateAction<string>>) => {
    await resetOffset(serviceUUID, resetCharacteristicUUID);

    let combinedData = Buffer.alloc(0); // Initialize an empty buffer
    let hasMoreChunks = true;

    try {
      while (hasMoreChunks) {
        const chunk = await getChunk(serviceUUID, characteristicUUID);
          
        if (chunk !== null) {
          // console.log(base64.decode(String(chunk)));
          combinedData = Buffer.concat([combinedData, chunk]);

          const chunkSize = chunk.length;
          const expectedSize = 512;
          if (chunkSize < expectedSize) {
            // console.log(chunkSize);
            hasMoreChunks = false;
          }
        } else {
          hasMoreChunks = false;
        }
      }

      // console.log("ALL CHUNKS: ", allChunks)
      await saveToFile(combinedData, file_name, setImagePath);
    } catch (error) {
      console.log("Error occured in fetchFile: ", error);
    }
  }


  /**
   * @param data -- The combined chunks of data
   * 
   * This method takes all chunks sent from the pi and saves them to a .jpg file on the phone.
   */
  const saveToFile = async (data: Buffer, file_name: string, setImagePath: React.Dispatch<React.SetStateAction<string>>) => {
    const path = RNFS.ExternalDirectoryPath + '/' + file_name;

    try {
        // Write the buffer data to the file directly
        await RNFS.writeFile(path, data.toString('base64'), 'base64');
        console.log(`File saved to: ${path}`);
        // Alert.alert('File downloaded', `File saved to ${path}`);
        setImagePath(path);
    } catch (error) {
        console.error('Error saving file:', error);
    }
  }


  // --------------------------- Entropy Graph ----------------------- //
  const [video_chartData, set_video_chartData] = useState<any>(null);

  const resetOffset_graph = async () => {
    try {
        await manager.writeCharacteristicWithResponseForDevice(
            deviceId,
            serviceUUID,
            '00000210-710e-4a5b-8d75-3e5b444bc3cf',
            base64.encode('reset')
        );

        console.log('Offset reset command sent');
    } catch (error) {
        console.log('Error resetting offset on GATT server:', error);
    }
  };

  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
    try {
        const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
        return readData;
    } catch (error) {
        console.log("Error while reading data from ble device: ", error);
        return null;
    }
  }

  const get_cpu_graph_data = async () => {
    await resetOffset_graph();
    const labels: string[] = [];
    const values: number[] = [];


    let line_data = null;
    while (true) {
      const response = await readCharacteristic(serviceUUID, '00000209-710e-4a5b-8d75-3e5b444bc3cf')

      line_data = base64.decode(response!.value!)
      if (line_data === "EOF") {
        break;
      }

      const data_parts = line_data.split(',');
      console.log(data_parts[0]);
      console.log(data_parts[1]);
      if (data_parts[1] != undefined) {
        labels.push(data_parts[0].substring(0, 6).replace(/"/g, ''));
        values.push(parseFloat(data_parts[1]));
      }
    }

    // console.log(values)
    set_video_chartData({ labels, datasets: [{ data: values, strokeWidth: 2 }] });
  }

  // ------------------------------------------------------------------- //
  

  const handleFetchVideoFile = async () => {
    try {
        await fetchFile(serviceUUID, videoCharacteristicUUID, FresetCharacteristicUUID, 'video_frame.jpg', setVideoImagePath);
        setPopupImageUrl(videoImagePath); // Set the URI for the popup image
        setShowImagePopup(true);
    } catch (error) {
        console.log('Error fetching file:', error);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header */}
      <View style={styles.headContainer}>
        <Text style={styles.title}>Mic and Camera</Text>
        <Text>Device Name: {deviceName || 'Unknown Device'}</Text>
        <Text style={styles.instructions}>
          Below, you can view information collected from the microphone and camera from the Raspberry Pi.
        </Text>
      </View>

      {/* Video Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Video</Text>
        <Text>File size: {videoFileSize}</Text>
        <Text>Creation Date: {videoDate}</Text>
        {/*{videoImagePath ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: 'file://' + videoImagePath }} style={styles.image} resizeMode="contain" />
          </View>
        ) : (
          <Text></Text>
        )}*/}
        {/* New image rendering testing */}
        {showImagePopup && (
            <View style={styles.popupContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowImagePopup(false)}>
                    <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                <Image source={{ uri: 'file://' + videoImagePath }} style={styles.popupImage} resizeMode="contain" />
            </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.Button} onPress={handleFetchVideoFile}>
            <Text style={styles.ButtonText}>Download Frame</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.Button} onPress={handlePicture}>
            <Text style={styles.ButtonText}>Take Picture</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.graphSection}>
        <View style={styles.graphContainer}>
          <LineGraph
            chartData={video_chartData}
          />
        </View>
        </View>
      </View>

      </ScrollView>
    </View>
  )
};
  

const styles = StyleSheet.create({
  headContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  sectionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageContainer: {
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  Button: {
    marginTop: 20,
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  ButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  popupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  popupImage: {
    width: '80%',
    height: '80%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },

  graphContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  graphSection: {
    flex: 1,
    width: '100%',
    marginBottom: 20,
  },
});
  
export default VideoTab;
  