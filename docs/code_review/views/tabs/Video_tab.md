# *video_tab.md*
File responsible for functions and data involving camera connected to Raspberry Pi. Those include:
- File size and recording date and time of most recent video recording on Pi.
- Line graph displaying file sizes of all video recordings on the Pi for the day. Pulled from the saved csv file.
- 'Download Frame': When this is pressed, it pulls a frame from the most recent video and displays it for the user.
- 'Take picture': There may not be a video still on the Pi. To make sure that the camera is working, the user can press this button. This takes a picture using the camera attached to the pi and then displays it to the user.
