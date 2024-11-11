# Bluetooth Directory Documentation


## App_permissions.tsx
File used to request necessary permissions for application from device. The following permissions are requested:

  ### **requestExternalStoragePermission()**
  Method used to request external storage permissions from device. This permission is        required for pulling images from the GATT server. The pulled images are saved to the       device running the application so that they can be viewed.

  ### **requestBluetoothPermission()**
  Method used to request bluetooth permissions from device. This permission is required      in order to bluetooth connect to the GATT server.

  ### **requestPermissions()**
  Method called in DeviceListScreen.tsx, functions sort of like the main method of the       file. It runs the methods above for requesting necessary permissions.


## AppmaisCheck.tsx
File used to check if the AppMAIS process is currently running. This is used to ensure we don't have any conflicts due to running certain functionality within the application at the same time. Operations within the app that could cause conflict include *take picture* and *sending commands*

  ### **isDuringAppmais()**
  Only method in the file, responsible for checking if the Appmais process is running. Works by converting the *Capture_window_start_time* and current time into seconds since midnight. It then gets the difference between those values and mods that by *capture_interval*.     This tells us where in the current interval we are. We can then use this value and *capture_duration* to determine if Appmais is currently running.
