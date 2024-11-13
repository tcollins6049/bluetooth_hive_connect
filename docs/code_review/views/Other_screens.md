# Views Directory Documentation (screens)

## **DeviceListScreen.tsx**
File for the start screen of the application. Displays a list of registered Raspberry Pi's. Can connect to a registered device or scan for unregistered devices.

### *connectToDevice()*
Method responsible for connecting application to Raspberry Pi. This method attempts a connection, if successful it navigates to the password screen. If unsuccessful it calls showRetryAlert(). 

### *startScan()*
Method called after pressing the 'scan for devices' button. Scans for and displays found devices. Used if the user wants to connect to a device which hasn't been registered yet. If a device is found, the user can select it to attempt to connect to it.

### *showRetryAlert()*
Alert shown if connection fails. Gives the user the option to either cancel connection or try again.


## **PasswordScreen.tsx**
File responsible for the password screen in the application. Where the user enters password in order to have access to the Raspberry Pi.

### *handlePasswordSubmit()*
Takes user input and writes it to characteristic on GATT server located on Raspberry Pi. It then reads the response from the Pi determining if the password was correct or not. If the password was correct, it navigates you to DeviceDetailScreen.
