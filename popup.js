document.addEventListener('DOMContentLoaded', function() {
    const extensionToggle = document.getElementById('extension-toggle-input')
    chrome.storage.local.get('autoCampaign', function(data) {
        // Check if 'autoCampaign' exists in the stored data
        const isChecked = data.autoCampaign === undefined ? true : data.autoCampaign;
    
        // Update the checkbox state based on the retrieved value
        extensionToggle.checked = isChecked;
    
      });
    extensionToggle.addEventListener('change', function(event) {
    // Retrieve the current state of the checkbox (true or false)
    const isChecked = event.target.checked;

    // Perform actions based on the checkbox state
    if (isChecked) {
      // Checkbox is checked (ON state)
      console.log('Extension is ON');
      // Call a function to enable extension features
      // enableExtensionFeatures();
    } else {
      // Checkbox is unchecked (OFF state)
      console.log('Extension is OFF');
      // Call a function to disable extension features
      // disableExtensionFeatures();
    }
    chrome.storage.local.set({'autoCampaign': isChecked});

  });
    document.getElementById('saveCampButton').addEventListener('click', function() {
        try {
            let campName = document.getElementById('campaign-name-input').value.trim()
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'saveCampaign', campName: campName});
                setTimeout(() => {
                    readAllProfiles();
                }, 500);
            });
        } catch (error) {
            console.log(error);
        }
    })
    
    document.getElementById('export-camps-btn').addEventListener('click', function() {
        exportCamps();
    })

    document.getElementById('import-camps-btn').addEventListener('click', function() {
        importCamps();
    })

    document.getElementById('readDataButton').addEventListener('click', function() {
        readAllProfiles();
    })

    document.getElementById('testActive').addEventListener('click', function() {
        setActiveCamp();

    })
    readAllProfiles();
    setTimeout(() => {
        setActiveCamp();
    }, 100);
   
  });

// Listen for messages from background.js
try {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        // Receive the data from content.js
        if (message.dataFromContent) {
            console.log('Data received in popup:', message.dataFromContent);
            writeProfile(message.dataFromContent)
            // Use the data as needed
        }
    });
} catch (error) {
    
}

function setActiveCamp() {
    getActiveCamp().then(activeCamp => {
        if (activeCamp) {
            console.log('Active Campaign:', activeCamp);
            document.getElementById('active-camp').innerText = activeCamp.profileName
            // Do something with the active campaign data
            // set active index:
            chrome.storage.local.get('campDataArray', function(data) {
                let campDataArray = data['campDataArray'] || []; // Retrieve existing campDataArray or create an empty array if it doesn't exist
          
                // Check if a profile with the same profileName already exists
                let activeIndex = campDataArray.findIndex(item => item.profileName === activeCamp.profileName);
                if (activeIndex !== -1) {
                    let infoSections = document.querySelectorAll('.brief-info-section');
                    for(let i =0; i < infoSections.length; i++) {
                        if(i == activeIndex){
                            infoSections[i].classList.add('active-info-section')
                            break;
                        }
                    }  
                  
                } 
          
               
              });



        } else {
            console.log('No active campaign found');
        }
    }).catch(error => {
        console.error('Error retrieving active campaign:', error);
    });
}







function writeProfile(profile) {
    return new Promise((resolve, reject) => {
      // Read existing campData array from local storage
      chrome.storage.local.get('campDataArray', function(data) {
        let campDataArray = data['campDataArray'] || []; // Retrieve existing campDataArray or create an empty array if it doesn't exist
  
        // Check if a profile with the same profileName already exists
        let existingIndex = campDataArray.findIndex(item => item.profileName === profile.profileName);
        if (existingIndex !== -1) {
          // If profile with the same profileName exists, update it
          campDataArray[existingIndex] = profile;
        } else {
          // Otherwise, add the new profile to the array
          campDataArray.push(profile);
        }
  
        // Write updated campDataArray back to local storage
        chrome.storage.local.set({ 'campDataArray': campDataArray }, function() {
          console.log('Profile saved to local storage:', profile);
          resolve(); // Resolve the promise once the operation is completed
        });
      });
    });
  }
  
  function exportCamps() {
    getCampDataArray()
    .then(campDataArray => {
        let campDatasString = JSON.stringify(campDataArray)
        const textarea = document.createElement('textarea');
            textarea.value = campDatasString;
            textarea.style.position = 'fixed'; // Ensure the textarea is not visible
            document.body.appendChild(textarea);

            // Select the textarea content and copy it to the clipboard
            textarea.select();
            document.execCommand('copy');

            // Clean up: remove the textarea from the DOM
            document.body.removeChild(textarea);
    })
  }

  function importCamps() {
    // Create a hidden textarea element to capture pasted content
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed'; // Ensure the textarea is not visible
    textarea.style.opacity = 0; // Hide the textarea
    document.body.appendChild(textarea);

    // Focus the textarea to enable pasting
    textarea.focus();

    // Use document.execCommand('paste') to capture clipboard content
    document.execCommand('paste');

    // Retrieve the pasted content from the textarea
    const clipboardContent = textarea.value;

    // Clean up: remove the textarea from the DOM
    document.body.removeChild(textarea);

    console.log('Pasted content from clipboard:', clipboardContent);

    // Now you can process the clipboardContent (e.g., parse JSON)
    try {
        getCampDataArray()
            .then(campDataArray => {
                console.log('Existing camp data:', campDataArray);

                // Merge the new camp data into the existing camp data array
                newCampDataArray.forEach(newCamp => {
                    // Check if the new camp profileName does not exist in the existing campDataArray
                    const isProfileNameUnique = !campDataArray.some(oldCamp => oldCamp.profileName === newCamp.profileName);

                    if (isProfileNameUnique) {
                        // Add the new camp to the existing campDataArray
                        newCamp.isActive = false;
                        campDataArray.push(newCamp);
                    }
                });

                // Save the updated camp data array to local storage
                chrome.storage.local.set({ 'campDataArray': campDataArray }, function() {
                    console.log('Camp data updated and saved successfully.');
                    alert('Camp data updated and saved successfully!');
                });
            })
            .catch(error => {
                console.error('Error retrieving camp data:', error);
                alert('Failed to import camp data. Please try again.');
            });
    } catch (error) {
        console.error('Error parsing clipboard content:', error);
        alert('Failed to import camp data from clipboard. Please make sure the content is valid.');
    }
}

function extensionToggle(checkbox) {
    // Retrieve the current state of the checkbox (true or false)
    const isChecked = checkbox.checked;
  
    // Perform actions based on the checkbox state
    if (isChecked) {
      // Checkbox is checked (ON state)
      console.log('Extension is ON');
      // Call a function to enable extension features
      // enableExtensionFeatures();
    } else {
      // Checkbox is unchecked (OFF state)
      console.log('Extension is OFF');
      // Call a function to disable extension features
      // disableExtensionFeatures();
    }
  }

  function getCampDataArray() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('campDataArray', function(data) {
            const campDataArray = data['campDataArray'] || [];

            resolve(campDataArray); // Resolve the Promise with campDataArray
        });
    });
}
  

  function readAllProfiles() {
    // Read campDataArray from local storage
    chrome.storage.local.get('campDataArray', function(data) {
      const campDataArray = data['campDataArray'] || [];
      console.log('All campData:', campDataArray);

      updateCampaignsTable(campDataArray)


    });
    setTimeout(() => {
        setActiveCamp();
    }, 100);
  }
  
  // Example usage
  let campData1 = {
    profileName: 'profile1',
    data: {
      headlines: ['headline1', 'headline2', 'headline3'],
      siteUrl: 'apple.com',
      keywordTag: ['iphone 1', 'iphone 2', 'iphone 3'],
      keywords: 'key1\nkey2\nkey3\nkey4'
    }
  };
  
  let campData2 = {
    profileName: 'profile2',
    data: {
      headlines: ['headline4', 'headline5', 'headline6'],
      siteUrl: 'google.com',
      keywordTag: ['android 1', 'android 2', 'android 3'],
      keywords: 'android key1\nandroid key2\nandroid key3'
    }
  };


  // table
  function removeTag(element) {
    element.parentNode.remove();
}

function addTag(event) {
    if (event.key === 'Enter' && event.target.value.trim() !== '') {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = event.target.value + ' ';
        const removeIcon = document.createElement('i');
        removeIcon.textContent = '×';
        removeIcon.onclick = function() { removeTag(removeIcon); };
        tagSpan.appendChild(removeIcon);
        event.target.parentNode.insertBefore(tagSpan, event.target);
        event.target.value = '';
    }
}

function toggleCollapse(element) {
    const collapsible = element.querySelector('.main-row');
    collapsible.style.display = collapsible.style.display === 'none' ? 'block' : 'none';
}

function deleteCampaign(element, index) {
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    setTimeout(() => {
        element.remove();
        // Additional JS code or reloading table goes here
    }, 300); // Transition time

    chrome.storage.local.get('campDataArray', function(data) {
        let campDataArray = data['campDataArray'] || [];
        console.log('All campData:', campDataArray);
  
        try {
            let modifiedArr = campDataArray.filter((_, i) => i !== index);
            chrome.storage.local.set({ 'campDataArray': modifiedArr })
            document.getElementById('active-camp').innerText = ''
        } catch (error) {
            
        }
        
        setTimeout(() => {
            readAllProfiles()
        }, 500);
        // setback

  
      });


}

// Select all div elements with the class 'info-section'


function setTableRowSelected() {
    try {
        let infoSections = document.querySelectorAll('.brief-info-section');
    
        // Loop through each 'info-section' div
        infoSections.forEach(function(infoSection, index) {
            // Add a click event listener to each 'info-section' div
            infoSection.addEventListener('click', function() {
                // Remove the 'active-info-section' class from all elements
                infoSections.forEach(function(section) {
                    section.classList.remove('active-info-section');
                });
                // Add the 'active-info-section' class to the clicked element
                infoSection.classList.add('active-info-section');
                
                // Add your click event handler code here
                console.log('Info section ' + index + ' clicked');
                // change profile Name
                document.getElementById('active-camp').innerText = infoSection.querySelector('span').innerText

                chrome.storage.local.get('campDataArray', function(data) {
                    let campDataArray = data['campDataArray'] || [];
                    console.log('All campData:', campDataArray);
              
                    for(let i =0; i < campDataArray.length; i++){
                        try {
                            campDataArray[i].isActive = i == index
                        } catch (error) {
                            
                        }
                    }
                    chrome.storage.local.set({ 'campDataArray': campDataArray })
                    
                    // setback

              
                  });

                // set active in local
            });
        }); 
    } catch (error) {
        console.log('err info  -----',error);
    }
}

function getActiveCamp() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('campDataArray', function(data) {
            const campDataArray = data['campDataArray'] || [];
            console.log('All campData:', campDataArray);

            for (let i = 0; i < campDataArray.length; i++) {
                try {
                    if (campDataArray[i].isActive) {
                        resolve(campDataArray[i]); // Resolve with the active campaign data
                        return;
                    }
                } catch (error) {
                    // Handle any error if needed
                }
            }

            resolve(null); // Resolve with null if no active campaign is found
        });
    });
}

// reload table
function updateCampaignsTable(data) {
    const table = document.getElementById('campaigns-table');

    // Clear existing content inside the campaigns table
    table.innerHTML = '';

    // Loop through each campaign data and create corresponding HTML structure
    data.forEach(campaign => {
        // campaign.data.keywordTag
        // Create elements for a single campaign
        const singleCampaign = document.createElement('div');
        singleCampaign.classList.add('singleCampaign');

        const briefCampaign = document.createElement('div');
        briefCampaign.classList.add('brief-campaign');
        const briefInfoSection = document.createElement('div');
        briefInfoSection.classList.add('brief-info-section');
        briefInfoSection.innerHTML = `<span>${campaign.profileName}</span>`;
        briefCampaign.appendChild(briefInfoSection);

        const actionControl = document.createElement('div');
        actionControl.classList.add('action-control');
        actionControl.innerHTML = `
            <img src="img/arrow_down.png" class="arrow-button toggle-button">
            <img src="img/compose.png" class="edit-button">
            <img src="img/trash.png" class="delete-button">
        `;
        briefCampaign.appendChild(actionControl);

        const data = campaign.data
        const mainRow = document.createElement('div');
        mainRow.style.display = 'none'
        mainRow.classList.add('main-row');
        const headlineInfo = document.createElement('div');
        headlineInfo.classList.add('info-section');
        headlineInfo.innerHTML = `<span>Headline:</span> ${data.headlines.join(', ')}`;
        mainRow.appendChild(headlineInfo);

        const siteUrlInfo = document.createElement('div');
        siteUrlInfo.classList.add('info-section');
        siteUrlInfo.innerHTML = `<span>siteUrl:</span> ${data.siteUrl}`;
        mainRow.appendChild(siteUrlInfo);

        const keywordTagInfo = document.createElement('div');
        keywordTagInfo.classList.add('info-section', 'keywordTag');
        keywordTagInfo.innerHTML = `
            <span>keywordTag:</span>
            <div class="tags-input-container">
                ${data.keywordTag.map(tag => `<span class="tag">${tag} <i class="remove-tag" onclick="removeTag(this)">×</i></span>`).join('')}
                <input type="text" placeholder="Add a tag" onkeydown="addTag(event)">
            </div>
        `;
        mainRow.appendChild(keywordTagInfo);

        const keywordInfo = document.createElement('div');
        keywordInfo.classList.add('info-section');
        keywordInfo.innerHTML = `<span>keyword</span><textarea placeholder="Enter keywords one per line">${data.keywords}</textarea>`;
        mainRow.appendChild(keywordInfo);

        // Append all created elements to the single campaign container
        singleCampaign.appendChild(briefCampaign);
        singleCampaign.appendChild(mainRow);

        // Append the single campaign to the campaigns table
        table.appendChild(singleCampaign);
        
       
    });
    setTableRowSelected()
    setNonInlineToggle()
    setDeleteButtons()
}

function setNonInlineToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-button');

    toggleButtons.forEach(button => {
        // button.removeEventListener('click', toggleCollapse);

        button.addEventListener('click', function() {
            // Find the parent element to toggle (adjust this based on your HTML structure)
            const parentElement = this.parentNode.parentNode.parentNode; // Example: Adjust this based on your HTML structure

           toggleCollapse(parentElement);
        });
    });
}

function setDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-button');

    deleteButtons.forEach((button, index)  => {

        button.addEventListener('click', function() {
            // onclick="deleteCampaign(this.parentNode.parentNode.parentNode)"
            const parentElement = this.parentNode.parentNode.parentNode; // Example: Adjust this based on your HTML structure
           deleteCampaign(parentElement, index);
        });
    });
}