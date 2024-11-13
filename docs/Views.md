# Views Directory Documentation (screens)

## **DeviceListScreen.tsx**
File for the start screen of the application. Displays a list of registered Raspberry Pi's. Can connect to a registered device or scan for unregistered devices.

### *connectToDevice()*

### *startScan()*

### *showRetryAlert()*



## **PasswordScreen.tsx**
File responsible for the password screen in the application. Where the user enters password in order to have access to the Raspberry Pi.

### *handlePasswordSubmit()*



## **DeviceDetailsScreen.tsx**
File holding the home page of the application. The methods in this file are responsible for getting data for each of the sensors. The data for this screen comes from the saved sensor files on the Raspberry Pi obtained through the AppMAIS recording process. 

### Methods for handling graph data
#### *get_graph_data()*

#### *processData()*

#### *handle_graph_value()*


### Methods for getting sensor and file data

#### *readAndParseFileData()*

#### *processCpuLineData()*

#### *processHumTempLineData()*

#### *processSensorData()*
