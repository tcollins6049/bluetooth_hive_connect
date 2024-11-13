# Tabs Directory Documentation
Directory containing all tabs used within the app. This includes the modifications, sensors, commands, video_tab, and audio_tab tab files. 

## **modifications.tsx**
File responsible for displaying list of modifiable variables from the beemon-config.ini file on the Raspberry Pi. These variables include:
* *capture_window_start_time* -- At what time the AppMAIS process starts recording.
* *capture_window_end_time* -- At what time the AppMAIS process ends recording.
* *capture_interval_seconds* -- Time between sensor recordings.
* *capture_duration_seconds* -- How long the sensors record at each interval.
  
The app shows two sets of these variables. One set is for the camera and the other set for all the other sensors. This is so that the camera can be set to record at different times than the other sensors.

### *readCharacteristic()*
Method used to read from a characteristic on the Raspberry Pi. Needs the UUID of the characteristic being read from.

### *writeCharacteristic()*

### *fetchData()*

### *submitChanges()*

### *handleSubmit()*
