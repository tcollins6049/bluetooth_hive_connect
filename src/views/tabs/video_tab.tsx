import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import base64 from 'react-native-base64';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

import manager from '../../files/BLEManagerSingleton';
import isDuringAppmais from '../../files/appmaisCheck';
import LineGraph from '../../modals/Line_graph';
import AppTimingModal from '../../modals/AppTimingModal';


/**
 * Renders most recent video file basic info from Pi.
 * Also renders entropy graph and provides functionality for extracting a video frame or taking a picture using Pi camera.
 * 
 * @param {string}  deviceId  id of connected device
 * @param {string}  deviceName  name of connected device
 * 
 * @returns {JSX.Element} Screen displaying basic video info and entropy graph.
 */
const VideoTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  // Service UUID and UUID's for characteristics used on this screen.
  const SERVICE_UUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_FILE_INFO_UUID = '00000202-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_UUID = '00000203-710e-4a5b-8d75-3e5b444bc3cf';
  const FRESET_UUID = '00000204-710e-4a5b-8d75-3e5b444bc3cf';
  const STATIC_UUID = '00000207-710e-4a5b-8d75-3e5b444bc3cf';
  const SRESET_UUID = '00000208-710e-4a5b-8d75-3e5b444bc3cf';
  const COMMAND_UUID = '00000023-710e-4a5b-8d75-3e5b444bc3cf';
  const VIDEO_LINE_UUID = '00000209-710e-4a5b-8d75-3e5b444bc3cf';

  const [videoImagePath, setVideoImagePath] = useState(''); // Holds the path of the extracted frame
  const [pictureImagePath, setPictureImagePath] = useState(''); // Holds the path of picture after it is taken

  // useState for basic video info (file size and date)
  const [videoFileSize, setVideoFileSize] = useState<string>("No File Found");
  const [videoDate, setVideoDate] = useState<string>("No File Found");

  // Used to set visibility of images
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showPicturePopup, setShowPicturePopup] = useState(false);

  const [timing_modalVisible, set_timing_modalVisible] = useState(false); // Sets visibility of timing modal.


  // On focus, get basic file info and graph info.
  useFocusEffect(
    useCallback(() => {

      const initial = async () => {
        // Fetch the file when the tab is focused
        await readFileInfoCharacteristic(SERVICE_UUID, VIDEO_FILE_INFO_UUID);
        await get_cpu_graph_data();
      }

      initial();
    }, [])
  );


  /**
   * This function is used to read a characteristic providing basic file info such as the creation date and file size.
   * 
   * @param {string}  serviceUUID The service UUID
   * @param {string}  characteristicUUID  UUID for the characteristic being read
   */
  const readFileInfoCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
    try {
      // Read characteristics for the deviceId and wait for completion
      const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
  
      // Extract the base64 encoded value from the read data
      let base64Value = readData.value;
  
      if (base64Value) {
        // Decode value
        let decodedValue = base64.decode(base64Value);
        
        // Extract date and file size
        const decoded_fileSize = decodedValue.split(', ')[1]
        const decoded_filePath = decodedValue.split(', ')[0]
        setVideoDate(extractCreationDate(decoded_filePath))
        formatFileSize(decoded_fileSize)
      }
    } catch (error) {
      // Log any errors that occur during the read operation.
      console.log("Error while reading data from ble device: ", error);
    }
  }


  /**
   * The file path passed in will look like this: "/2024-06-13/rpi4-60@2024-06-13@14-40-00.h264"
   * This function extracts the time and date from that path and returns them as a string.
   * 
   * @param {string}  filePath Path of file we are extracting creation date from
   * 
   * @returns {string}  Creation date if successful, otherwise "No Match Found"
   */
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


  /**
   * The characteristic we read returns the file size in bytes.
   * In this method we convert the file size from bytes to its largest, best formatted size.
   * 
   * @param {string}  currSize  Size read from the characteristic in bytes
   */
  const formatFileSize = (currSize: string) => {
    const match = currSize.match(/(\d+)/);
    const bytes = match ? parseInt(match[0], 10) : 0;
    
    const kilobytes = bytes / 1024;
    const megabytes = bytes / (1024 ** 2);
    const gigabytes = bytes / (1024 ** 3);
  
    if (gigabytes >= 1) {
      setVideoFileSize(`${gigabytes.toFixed(2)} GB`);
    } else if (megabytes >= 1) {
      setVideoFileSize(`${megabytes.toFixed(2)} MB`);
    } else if (kilobytes >= 1) {
      setVideoFileSize(`${kilobytes.toFixed(2)} KB`);
    } else {
      setVideoFileSize(`${bytes} bytes`);
    }
  };


  // ---------------- Methods in this section are responsible for sending command for taking picture -------------------- //
  /**
   * Called when the "Take Picture" button is pressed.
   * Sends a command to the Pi to make it take a picture, then retrieves this picture from the Pi.
   * 
   */
  const handlePicture = async () => {
    try {
      // If the AppMAIS process is not currently running.
      if (!(await isDuringAppmais(deviceId))) {
        // Send command to Pi to take picture
        await sendCommand('libcamera-still -q 10 -o picture.jpg')

        // Get picture from Pi.
        await fetchFile(SERVICE_UUID, STATIC_UUID, SRESET_UUID, 'hive_picture.jpg', setPictureImagePath);
        setShowPicturePopup(true);
      } else {
        // AppMAIS process is running, show modal telling user to wait and try again.
        console.log("Couldn't take picture, appmais process is running")
        set_timing_modalVisible(true);
      }
    } catch (error) {
        console.log('Error fetching file:', error);
    }
  };


  /**
   * Sends the given command to be run on the Pi.
   * 
   * @param {string}  commandToSend Command to send to Pi
   */
  const sendCommand = async (commandToSend: string) => {
    try {
      // Encode the command to base64
      const encodedCommand = base64.encode(commandToSend);

      // Write the command to the characteristic
      await manager.writeCharacteristicWithResponseForDevice(
        deviceId,
        SERVICE_UUID,
        COMMAND_UUID,
        encodedCommand
      );

      console.log('Command sent successfully.');
    } catch (writeError) {
      console.log('Error sending command:', writeError);

      let errorMessage = 'Failed to send command.';

      // Type narrowing to check if writeError has a message property
      if (writeError instanceof Error) {
        // If error message matches 'Operation was rejected' but command was executed, treat it as success
        if (writeError instanceof Error && writeError.message.includes('Operation was rejected')) {
          console.log('Operation was rejected error ignored.');
        } else {
          errorMessage = writeError.message;
        }
      }
    }
  };


  // ---------------- Parts below here correspond to file transfers and don't need to be touched. ----------------------- //

  /**
   * This method is responsible for reading a single chunk of a data from a file on the Raspberry Pi.
   * This is a part of the file transfer process. 512 bytes will be read at a time.
   * 
   * @param {string}  serviceUUID The service UUID
   * @param {string}  characteristicUUID  UUID of the characteristic being read.
   * 
   * @returns {Buffer | null} A 512 byte chunk of data from a file
   */
  const getChunk = async (serviceUUID: string, characteristicUUID: string): Promise<Buffer | null> => {
    try {
      // Read chunk of data from file.
      const data = await manager.readCharacteristicForDevice(
        deviceId,
        serviceUUID,
        characteristicUUID
      );

      // Decode value
      if (data.value !== null) {
        const decodedData = Buffer.from(data.value, 'base64'); // Assuming data.value is base64 encoded
  
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
   * 
   * @param {string}  serviceUUID The service UUID
   * @param {string}  resetCharacteristicUUID UUID for resetting the file offset
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
   * The main method for the file transfer process
   * This method loops through each chunk of file data, pulls the chunk of data from the pi, and then concatenates them and sends them to saveToFile()
   * 
   * @param {string}  serviceUUID The service UUID
   * @param {string}  characteristicUUID  The UUID of the characteristic being read (all chunks have the same UUID)
   * @param {string}  resetCharacteristicUUID The UUID of the offset reset characteristic.
   * @param {string}  file_name Name to save the resulting file under
   * @param {React.Dispatch<React.SetStateAction<string>>}  setImagePath  The variable to store the final image path in
   */
  const fetchFile = async (serviceUUID: string, characteristicUUID: string, resetCharacteristicUUID: string, file_name: string, setImagePath: React.Dispatch<React.SetStateAction<string>>) => {
    // Reset offset to ensure we are starting at beginning of file.
    await resetOffset(serviceUUID, resetCharacteristicUUID);

    let combinedData = Buffer.alloc(0); // Initialize an empty buffer
    let hasMoreChunks = true;
    try {
      // While there are more chunks to be read
      while (hasMoreChunks) {
        const chunk = await getChunk(serviceUUID, characteristicUUID);  // Read chunk of data
          
        if (chunk !== null) {
          combinedData = Buffer.concat([combinedData, chunk]);  // Add chunk to combined data

          // If recieved chunk's size is les than 512 then we have reached the end of the file, therefore we are finished.
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

      // Save combined chunks to file.
      await saveToFile(combinedData, file_name, setImagePath);
    } catch (error) {
      console.log("Error occured in fetchFile: ", error);
    }
  }


  /**
   * Takes the combined chunks from Pi and saves them to a file
   * 
   * @param {Buffer}  data  Combined chunks of data
   * @param {string}  file_name Name to save the resulting file under
   * @param {React.Dispatch<React.SetStateAction<string>>}  setImagePath  The variable to store the final image path in
   */
  const saveToFile = async (data: Buffer, file_name: string, setImagePath: React.Dispatch<React.SetStateAction<string>>) => {
    const path = RNFS.ExternalDirectoryPath + '/' + file_name;

    try {
        await RNFS.writeFile(path, data.toString('base64'), 'base64');  // Write the buffer data to the file directly

        console.log(`File saved to: ${path}`);
        setImagePath(path);
    } catch (error) {
        console.error('Error saving file:', error);
    }
  }


  // --------------------------- Entropy Graph ----------------------- //

  const [video_chartData, set_video_chartData] = useState<any>(null); // useState to hold chart data

  /**
   * Resets the offset of reading the video file sizes csv file.
   * 
   */
  const resetOffset_graph = async () => {
    try {
      await manager.writeCharacteristicWithResponseForDevice(
        deviceId,
        SERVICE_UUID,
        '00000210-710e-4a5b-8d75-3e5b444bc3cf',
        base64.encode('reset')
      );

      console.log('Offset reset command sent');
    } catch (error) {
      console.log('Error resetting offset on GATT server:', error);
    }
  };


  /**
   * Reads data from passed in characteristic
   * 
   * @param {string}  serviceUUID   The service UUID
   * @param {string}  characteristicUUID  UUID of the characteristic we are reading
   * 
   * @returns Data read from characteristic
   */
  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string) => {
    try {
        const readData = await manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
        return readData;
    } catch (error) {
        console.log("Error while reading data from ble device: ", error);
        return null;
    }
  }


  /**
   * Read each line of file on Pi containing video file sizes.
   * Keep track of dates for labels and sizes for values.
   * Add these to the chart data to be points on the graph.
   * 
   */
  const get_cpu_graph_data = async () => {
    await resetOffset_graph();  // Reset offset ensuring we start at beginning of file
    const labels: string[] = [];  // Array for holding point labels
    const values: number[] = [];  // Array for holding point values


    let line_data = null;
    while (true) {
      const response = await readCharacteristic(SERVICE_UUID, VIDEO_LINE_UUID) // Read line from file

      // Decode line, if line is "EOF", we have reached the end of the file and are finished.
      line_data = base64.decode(response!.value!)
      if (line_data === "EOF") {
        break;
      }

      // Split data into pieces. (parts[0] = date/label, parts[1] = file size/value)
      const data_parts = line_data.split(',');
      console.log(data_parts[0]);
      console.log(data_parts[1]);

      // Push results onto label and value arrays
      if (data_parts[1] != undefined) {
        labels.push(data_parts[0].substring(0, 6).replace(/"/g, ''));
        let value = parseFloat(data_parts[1]) / (1024 ** 2)
        values.push(value);
      }
    }

    set_video_chartData({ labels: labels, datasets: [{ data: values, strokeWidth: 2 }] });  // Add label and value array data to the chartData
  }

  // ------------------------------------------------------------------- //
  
  /**
   * Called when "Get Frame" is pressed.
   * Gets a video frame from the Pi and displays it on screen.
   * 
   */
  const handleFetchVideoFile = async () => {
    try {
      // If the AppMAIS process is not currently running
      if (!(await isDuringAppmais(deviceId))) {
        // Get extracted video frame from Pi.
        await fetchFile(SERVICE_UUID, VIDEO_UUID, FRESET_UUID, 'video_frame.jpg', setVideoImagePath);
        setShowImagePopup(true);
      } else {
        // AppMAIS process is running, tells user to wait and try again.
        console.log("Cannot extract frame, the appmais process is running");
        set_timing_modalVisible(true);
      }
    } catch (error) {
      console.log('Error fetching file:', error);
    }
  };


  /**
   * Displays the most recent video files basic data (date and file size)
   * Displays a line graph based around video file sizes.
   * Displays two buttons, "Get Frame" retrives a frame from the most recent recording on the PI
   *  "Take Picture" uses the camera attached to the Pi to take a picture.
   * 
   */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.headContainer}>
          <Text style={styles.title}>Camera</Text>
          <Text>Device Name: {deviceName || 'Unknown Device'}</Text>
          <Text style={styles.instructions}>
            'Download Frame' - Pulls a frame from the most recent recording.
          </Text>
          <Text style={styles.instructions}>
            'Take Picture' - Used camera connected to Pi to take a picture.
          </Text>
        </View>

        {/* Video Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Video</Text>
          <Text>File size: {videoFileSize}</Text>
          <Text>Creation Date: {videoDate}</Text>
          
          {/* Shows extracted frame or taken picure */}
          {showImagePopup && (
              <View style={styles.popupContainer}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowImagePopup(false)}>
                      <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>
                  <Image source={{ uri: 'file://' + videoImagePath }} style={styles.popupImage} resizeMode="contain" />
              </View>
          )}
          {showPicturePopup && (
              <View style={styles.popupContainer}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowPicturePopup(false)}>
                      <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>
                  <Image source={{ uri: 'file://' + pictureImagePath }} style={styles.popupImage} resizeMode="contain" />
              </View>
          )}

          {/* Displays graph */}
          <View style={styles.graphSection}>
            <View style={styles.graphContainer}>
              <LineGraph
                chartData={video_chartData}
                color_code={'#47786a'}
              />
            </View>
          </View>

          {/* Footer: Get Frame and Take Picture buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.Button} onPress={handleFetchVideoFile}>
              <Text style={styles.ButtonText}>Download Frame</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.Button} onPress={handlePicture}>
              <Text style={styles.ButtonText}>Take Picture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* AppMAIS timing modal */}
      <AppTimingModal
        isVisible={timing_modalVisible}
        onClose={() => set_timing_modalVisible(false)}
      />
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
  