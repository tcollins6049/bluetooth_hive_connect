# **commands.tsx**
File responsible for screen which is used to send commands from the application to run on the Raspberry Pi. 

<img src="../../../images/bt_command_tab.jpg" alt="drawing" width="400"/>

## Variables
More detail about important variables before getting into methods

### *command setCommand useState*
Holds the current command entered by the user. This is what is displayed in the command text box on the screen and what will be sent to be run on the Pi.

### *quickCommands*
List of common commands. These are taken later and displayed below the text box. The user can then select one and it will auto fill the command into the command text box above.

### *isModalVisible useState*
Used to set visibility of the 'Are you sure?' modal. This is displayed whenever the user submits a command to be sent.

### *timing_modalVisible useState*
Used to set visibility of the AppTimingModal. We don't want to send a command while the AppMAIS process is running so if the AppMAIS process is running when the user presses send command, this modal is displayed letting them know to wait a minute before trying again.


## Methods
### *sendCommand()*
Method used to send the command entered by the user to the Rasbperry Pi. 
