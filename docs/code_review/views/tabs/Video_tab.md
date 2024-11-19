# **video_tab.md**
File responsible for functions and data involving camera connected to Raspberry Pi. Those include:
- File size and recording date and time of most recent video recording on Pi.
- Line graph displaying file sizes of all video recordings on the Pi for the day. Pulled from the saved csv file.
- 'Download Frame': When this is pressed, it pulls a frame from the most recent video and displays it for the user.
- 'Take picture': There may not be a video still on the Pi. To make sure that the camera is working, the user can press this button. This takes a picture using the camera attached to the pi and then displays it to the user.


## Variables
Details about important variables before getting into methods.

### *Variables ending in UUID*
These variables contain the UUID for the service and characteristics located on the Raspberry Pi GATT server. These are used to access those characteristics on the Pi allowing us to read and write data to the Pi.

### *videoImagePath useState*
Holds the path of the frame after being extracted after 'Download Frame'.

### *pictureImagePath useState*
Holds the path to the picture taken with the Pi camera after 'Take Picture'.

### *videoFileSize and videoDate useStates*
These hold the file size and recording date and time of the most recent recording on the Pi.

### *showImagePopup and showPicturePopup useStates*
Used to set visibility of images to be displayed. These are set visible based on which button is pressed, 'Extract Frame' or 'Take Picture".

### *timing_modalVisible useState*
Sets the visibility of the AppMAIS_timing modal. We don't want to attempt to take a picture if the AppMAIS process is currently running so if the process is running then we display this model telling the user to wait a minute before trying again.

### *loadModalVisible useState*
Pulling images can take some time so this model displays a loading symbol. This variable sets the visibility of the model which displays a loading icon. This is to let the user know that the image is being pulled.


## Methods
### *readFileInfoCharacteristic()*
Method used to get basic file info about the most recent video file on the Pi. This is what gets the file size and date of that file.

### *extractCreationDate()*
Method used to extract creation date of file given the file path.

### *formatFileSize()*
The file size pulled from the Pi will be in bytes. This method converts that to either KB, MB, or GB. 

### *handlePicture()*
Method called when the 'Take Picture' button is pressed. This starts the process of retrieving that image from the Pi.

### *handleFetchVideoFile()*
Method called when the 'Download Frame' button is pressed. This starts the process of extracting and retrieving a frame from the most recent recording on the Pi.

### *sendCommand()*
Called in handlePicture(), sends the command 'libcamera-still -q 10 -o /home/bee/GATT_server/picture.jpg'. This tells the Pi to take a picture using its camera.

### *fetchFile()*
Method used to pull file from Pi. Used with 'Take Picture' and 'Download Frame'. Pulls image after picture is taken or frame is extracted.

### *getChunk()*
Method called in fetchFile(), reads and returns a single chunk of data from the Pi. fetchFile() calls this method in a loop until no more chunks exist in the file. It then combines the chunks together forming the whole file.

### *saveToFile()*
Method saves combined chunks to a file.

### *get_cpu_graph_data()*
Method used to get data to display in line graph.
