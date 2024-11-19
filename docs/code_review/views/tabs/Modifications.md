# **modifications.tsx**
File responsible for displaying list of modifiable variables from the beemon-config.ini file on the Raspberry Pi. These variables include:
* *capture_window_start_time* -- At what time the AppMAIS process starts recording.
* *capture_window_end_time* -- At what time the AppMAIS process ends recording.
* *capture_interval_seconds* -- Time between sensor recordings.
* *capture_duration_seconds* -- How long the sensors record at each interval.
  
The app shows two sets of these variables. One set is for the camera and the other set for all the other sensors. This is so that the camera can be set to record at different times than the other sensors.

<img src="../../images/bt_modifications_tab.jpg" alt="drawing" width="400"/>


## Variables
### *variables, setVariables useState*
Keeps track of the current config variable values.

### *changedVariables useState*
Keeps track of variables that have been changed.

### *originalVariables useState*
Keeps track of the original variable values. Used to make sure we don't update variables unless they have been changed.


## Methods
### *readCharacteristic()*
Method used to read from a characteristic on the Raspberry Pi. Needs the UUID of the characteristic being read from.

### *writeCharacteristic()*
Method used to write a given value to a characteristic on the Raspberry Pi. We are using this to change variable values in the beemon-config.ini file.

### *fetchData()*
Method which calls readCharacteristic for each variable we want from the beemon-config.ini file. Used to get the current values from the file.

### *submitChanges()*
Method which writes new values to variables in the config file. Only writes a value to the config file if the value has been changed.

### *handleSubmit()*
Method called when the submit button is pressed. Checks if any variables have been changed to make sure were not needlessly updating variables. If variables have been changed then it shows the 'are you sure' modal. If the user then presses 'yes' then submitChanges() is called to update the variables.

