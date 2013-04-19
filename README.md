# BrowseTree 0.3 - A Google Chrome extension

Creates a Visual Tree Representation of a user's browsing activity.

## Installation instructions
The extension is not yet on the Chrome Webstore.<br>
[Instructions](http://developer.chrome.com/extensions/getstarted.html#unpacked "Installation Instructions")

## Version Information
+ 0.3 - Add dynamic sizing of visual tree area and static depth
+ 0.2 - Add d3.js and the tree representation of browsing activity
+ 0.1 - Display users browsing activity using ul's and li's

## Usage and Tips
+ To create a new node as a child of the current tab, open a link in a new tab.
+ To create a new node as a new root, open a link in a new window.
+ To ensure visiting a site creates a new root, open a new window before typing the URL. The new tab can be dragged into another window afterwards.

## Current Behavior
+ Visiting a different URL in the same tab will not always create a new node. This is due to caching and possibly other things.
+ Opening a new tab from another tab will set the new tab as a child of the current tab.
+ These behaviors can/will be changed in further releases.

## Upcoming Features/Changes
+ Improve the code
+ Improve the visualization
+ Add display of title, url, and other relevant information to nodes in the visual tree
+ Move/Convert/Remove list representation into the visual tree area
+ Add multiroot support
+ Add more default filtering
+ Add user filtering capability
+ Add ability to output data as JSON from various nodes in the tree
+ Add node snipping

*A cog in the Unseen-Data-Project*
