# Bluetooth Directory Documentation

## Table of Contents
- [App_permissions](#App_permissions.tsx)


## App_permissions.tsx
File used to request necessary permissions for application from device. The following permissions are requested:

  **requestExternalStoragePermission()**
  * Method used to request external storage permissions from device. This permission is        required for pulling images from the GATT server. The pulled images are saved to the       device running the application so that they can be viewed.

  **requestBluetoothPermission()**
  * Method used to ewquest bluetooth permissions from device. This permission is required     in order to bluetooth connect to the GATT server.

  **requestPermissions()**
  * Method called in DeviceListScreen.tsx, functions sort of like the main method of the       file. It runs the methods above for requesting necessary permissions.
