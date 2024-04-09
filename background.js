chrome.commands.onCommand.addListener(function(command) {
    if (command === "executeShortcut") {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "logHello" });
          });
    }
  });


// chrome.action.onClicked.addListener
  chrome.action.onClicked.addListener(function(tab) {
    // chrome.tabs.executeScript(tab.id, { file: 'content.js' });

    // testStorage();
    
  });
  
  function injectJs() {
    // chrome.scripting.executeScript({
    //   target: {tabId: tab.id},
    //   files: ['content.js']
    // });
  }

  function testStorage() {
    const data = {
      username: 'exampleUser',
      userId: 12345,
      preferences: {
          theme: 'dark',
          notifications: true
      }
    };
    
    // Write data to local storage
    chrome.storage.local.set({ 'myData': data }, function() {
      console.log('Data saved to local storage');
    });
  }


//   // Example data to save


  // Listen for messages from content.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // Send the received message to popup.js
  chrome.runtime.sendMessage({ dataFromContent: message.dataFromContent });
});



console.log('called bg');