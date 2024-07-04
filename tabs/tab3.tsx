import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import manager from '../ManagerFiles/BLEManagerSingleton';

const ThirdTab: React.FC<{ deviceId: string, deviceName: string }> = ({ deviceId, deviceName }) => {
  const serviceUUID = '00000001-710e-4a5b-8d75-3e5b444bc3cf';
    const cpu_file_UUID = '00000301-710e-4a5b-8d75-3e5b444bc3cf';
    const hum_file_UUID = '00000302-710e-4a5b-8d75-3e5b444bc3cf';
    const cpu_sensor_UUID = '00000002-710e-4a5b-8d75-3e5b444bc3cf';

    // Variables needed for handling file readings
    const [fileReadings, setFileReadings] = useState({
      cpuTemp: 'N/A',
      humidity: 'N/A',
      temp: 'N/A',
      cpuUpdateString: 'N/A',
      humUpdateString: 'N/A',
      tempUpdateString: 'N/A'
    });

    const [sensorReadings, setSensorReadings] = useState({
      cpuTemp: 'N/A',
      humidity: 'N/A',
      temp: 'N/A'
    });
    
    useFocusEffect(
        useCallback(() => {
            fetchData();

            return () => {
                console.log("ThirdTab is unfocused");
            };
        }, [deviceId])
    );


    const fetchData = async () => {
      try {
          const cpuFileData = await readCharacteristic(serviceUUID, cpu_file_UUID);

          const humTempFileData = await readCharacteristic(serviceUUID, hum_file_UUID);

          const sensorData = await readCharacteristic(serviceUUID, cpu_sensor_UUID);

          if (cpuFileData) {
              processCpuFileData(cpuFileData);
              processHumTempFileData(humTempFileData);
          }

          if (sensorData) {
              processSensorData(sensorData);
          }
      } catch (error) {
          console.error("Error in fetchData function: ", error);
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


    const processCpuFileData = (data: any) => {
        if (data.value) {
          let decodedValue = base64.decode(data.value);

          // Get CPU file reading
          const cpuTemp = decodedValue.split(',')[1];
          const cpuString = ((decodedValue.split(',')[2]).split('|')[1]);

          setFileReadings(prevState => ({
            ...prevState,
            cpuTemp: cpuTemp,
            cpuUpdateString: cpuString
          }));
        }
    }


    const processHumTempFileData = (data: any) => {
      if (data.value) {
        let decodedValue = base64.decode(data.value);

        // Get humidity file reading
        const temperature = decodedValue.split(',')[1];
        const tempString = (decodedValue.split('|')[1]);
        const humidity = (decodedValue.split(',')[2]).split('|')[0];

        setFileReadings(prevState => ({
          ...prevState,
          humidity: humidity,
          temp: temperature,
          humUpdateString: tempString,
          tempUpdateString: tempString
        }))
      }
    }

    const processSensorData = (data: any) => {
        setSensorReadings({
          cpuTemp: base64.decode(data.value),
          humidity: "N/A",
          temp: 'N/A'
        })
    }


    const handleRefresh = async () => {
        try {
            fetchData();
        } catch (error) {
            console.error("Error refreshing data: ", error);
        }
    };

    return (
      <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Sensor Readings:</Text>
          <Text style={styles.instructions}>
              Below are the current readings for each sensor on the Pi. One value is retrieved from a stored file, while the other is read directly from the sensor. 
              Press the refresh button to update the data.
          </Text>
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>CPU</Text>
              <Text style={styles.updateDate}>{fileReadings.cpuUpdateString}</Text>
              <Text style={styles.readingItem}>File: {fileReadings.cpuTemp}</Text>
              <Text style={styles.readingItem}>Sensor: {sensorReadings.cpuTemp}</Text>
          </View>
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Humidity</Text>
              <Text style={styles.updateDate}>{fileReadings.humUpdateString}</Text>
              <Text style={styles.readingItem}>File: {fileReadings.humidity}</Text>
              <Text style={styles.readingItem}>Sensor: None</Text>
          </View>
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Temperature</Text>
              <Text style={styles.updateDate}>{fileReadings.tempUpdateString}</Text>
              <Text style={styles.readingItem}>File: {fileReadings.temp}</Text>
              <Text style={styles.readingItem}>Sensor: None</Text>
          </View>
          </ScrollView>
          <View style={styles.footer}>
              <Pressable 
                    onPress={handleRefresh} 
                    style={styles.refreshButton}>
                    {({ pressed }) => (
                        <Text style={[styles.refreshButtonText, { color: pressed ? '#888' : '#000' }]}>
                            Refresh
                        </Text>
                    )}
                </Pressable>
          </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#f0f0f0',
  },
  section: {
      marginBottom: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
  },
  sectionTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: '#333',
      marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  instructions: {
      fontSize: 16,
      color: '#555',
      marginBottom: 20,
      alignSelf: 'flex-start',
  },
  updateDate: {
      fontSize: 14,
      color: '#666',
      marginBottom: 10,
  },
  readingItem: {
      fontSize: 16,
      color: '#444',
      marginBottom: 8,
      marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#000',
    alignItems: 'center',
  },
  refreshButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


export default ThirdTab;
