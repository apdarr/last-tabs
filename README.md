# Last Tabs, an extension for Raycast

One of my favorite features of Arc.app is the quick tab switcher (on macOS accessed by CMD + T). However, this switcher is limited to only a few entries at a time, and you must be focused on the Arc browser to use it. 

Like anyone, I'm constantly switching between multiple tabs during my day. It's handy to quickly jump to a latest tab after you've just consulted some documentation and are writing a GitHub issue, for example. 

This Raycast extension aims to provide that quick tab switching experience, allowing you to access your opened and most recently used tabs _without_ needing to be focused on the browser. 

It supports up to 50 entries. Currently it only works with Arc.app but planning to add support for Chrome and Safari in the future.

## Installation

- Clone or download this repository
- Install dependencies: `npm install`
- Build the extension: `npm run build`
- Add the chrome extension to your browser and run the extension: 
   - In Arc.app, go to `chrome://extensions/`, enable developer mode, and load the unpacked extension from the `chrome-extension` folder.
   - Navigate to the `chrome-extension` folder in your terminal and run `npm start` to start the tab server. 

When you run the app, tab history will be stored in a `.raycast-last-tabs.json` file in the root of your home directory. 

Ideally, we wouldn't need to provide a seperate Chrome extension, and could instead rely on the [Raycast browser extension API](https://developers.raycast.com/api-reference/browser-extension). However the `.getTabs()` method in the Raycast API does not return the last accessed time for each tab. As a result, we need a seperate extension to monitor the last time a user open or clicked on a particular tab. 

Because of this second extension dependency, I don't plan to publish this extension to the Raycast store. Instead, you can install it manually by following the steps above.

## Future improvements

- Add support for Chrome.app and Safari.app.
- When switching between tabs, sometimes the tab that a user is currently viewing is listed first. Figure out a way to address this.
- Add test suite.
- Revisit `Action.` commands to mirror other extensions like the Clipboard Manager extension.
- Find alternatives to using `.raycast-last-tabs.json` file, or save it in the project's root directory instead of the user's home directory.
