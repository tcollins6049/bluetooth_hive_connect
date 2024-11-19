# **sensorStates.tsx**
File responsible for displaying a list of sensors currently connected to the Pi. It displays each sensor and shows if the sensor is currently on or off. Here the user can turn sensors on and off. This works by changing the *auto_start* variable in the config file.

## Variables
Goes into more detail about important variables in the file before going into important methods.

### *Variables ending in UUID*
These variables hold the service UUID and the characteristics UUID. We need these to access the service and characteristics within the GATT server.

### *variables setVariables useState*
Used to set boolean values of each sensor. true = on, false = off.

### originalVariables setOriginalVariables useState*
Used to keep track of original values. So we only update sensor states if they have been changed from what they were originally.


## Methods
