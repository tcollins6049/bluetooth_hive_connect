# **sensorStates.tsx**
File responsible for displaying a list of sensors currently connected to the Pi. It displays each sensor and shows if the sensor is currently on or off. Here the user can turn sensors on and off. This works by changing the *auto_start* variable in the config file.

<img src="../../../images/bt_sensorstate_tab.jpg" alt="drawing" width="400"/>

## Variables
### *Variables ending in UUID*
These variables hold the service UUID and the characteristics UUID. We need these to access the service and characteristics within the GATT server.

### *variables setVariables useState*
Used to set boolean values of each sensor. true = on, false = off.

### *originalVariables setOriginalVariables useState*
Used to keep track of original values. So we only update sensor states if they have been changed from what they were originally.


## Methods
Methods in this file are very similar to methods in modifications.tsx. They are basically the same just calling different characteristics.

### *fetchData()*
Method which calls readCharacteristic for each sensor. Used to get the current states of each sensor.

### *readCharacteristic()*
Method used to read from a characteristic on the Raspberry Pi. Needs the UUID of the characteristic being read from.

### *writeCharacteristic()*
Method used to write a given value to a characteristic on the Raspberry Pi. Used to change sensor states via the auto_start variable in the beemon-config.ini file.

### *submitChanges()*
Method used to write changed sensor states to config file. Onyl updates sensor states if they have been changed.

### *handleSubmit()*
Shows the 'Are you sure?' modal. If the user presses yes on that modal then it calls submitChanges() to update the sensor states.
