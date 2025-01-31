# Components Directory Documentation

## **CustomHeader.tsx**
<img src="../images/bt_custom_header.jpg" alt="drawing" width="400"/>

File containing header displayed on the password and device detail screens. Header shows a title and a disconnect button. The disconnect button disconnects the application from the currently connect Raspberry Pi and returns to the start screen.

  ### *disconnectBleManager()*
  Method finds all connected device and then cancels the connection with each of them.

______________________________________________
## **Line_graph.tsx**
File used to create all line graphs within the application. Data and labels are passed in as parameters and are used to create the line graph.

<img src="../images/bt_line_graph.jpg" alt="drawing" width="400"/>

__________________________________
## **SideMenu.tsx**
File containing the side menu component. This menu allows users to navigate to different screens within the application, including Modifications, Audio, and Video. 

The menu slides in and out using an animated effect.

### *toggleMenu()*
Method that handles the opening and closing of the side menu using React Native's `Animated` API.

### *Navigation Buttons*
Each button navigates to a different screen:
- **Modifications**: Navigates to the modifications screen (`VarScreen`).
- **Audio**: Navigates to the audio screen.
- **Video**: Navigates to the video screen.

