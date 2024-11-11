# Bluetooth Directory Documentation

## Table of Contents
- [App_permissions](#App_permissions.tsx)
  - [requestExternalStoragePermission()](#initialize)
  - [requestBluetoothPermission()](#connecttodevice)
  - [requestPermissions()](#disconnect)


## App_permissions.tsx
File used to request necessary permissions for application from device. The following permissions are requested:

  ### requestExternalStoragePermission()
  Method used to request external storage permissions from device. This permission is        required for pulling images from the GATT server. The pulled images are saved to the       device running the application so that they can be viewed.

### requestBluetoothPermission()

