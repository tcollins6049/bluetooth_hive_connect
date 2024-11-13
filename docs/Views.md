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
Acts as the main method for getting data for the line graphs to display. Creates a structure for each sensor to hold the results and calls the processData() function for each sensor.

#### *processData()*
Function works by caling Det_FileRead(), located in a seperate file, to pull sensor data from file on Raspberry Pi. It then loops through each line of data from this file and passes it to handle_graph_value(). 

#### *handle_graph_value()*
This function processes the line of data (label, value) that is passed in. In this method, we keep track of a few variables:

This is what makes up the line of data we are processing
* label -- The passed in label
* value -- The passed in value

These arrays hold the data passed into the graph. No nan values can exist in these arrays or an error will be thrown. So these arrays will only hold read values and interpolated values.
* graph_labels -- Array of labels which will be used for graph creation
* graph_values -- Array of corresponding values which will be used for graph creation


### Methods for getting sensor and file data

#### *readAndParseFileData()*

#### *processCpuLineData()*

#### *processHumTempLineData()*

#### *processSensorData()*
