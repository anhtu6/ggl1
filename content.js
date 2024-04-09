chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'saveCampaign') {

        saveCampaignData(message.campName);
    }
});

function getActiveCamp() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('campDataArray', function (data) {
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

function findElementByCondition(callback) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const elements = document.querySelectorAll('*');
                    for (let element of elements) {
                        if (callback(element)) {
                            observer.disconnect();
                            resolve(element);
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

async function waitForElementAndClick(conditionCallback, callback = null) {
    const element = await findElementByCondition(conditionCallback);
    if (element) {
        // element.click();
        if (typeof callback === 'function') {
            callback();
        }
    }
}

waitForElementAndClick(element => element.tagName.toLowerCase() === 'div' && element.innerText.includes('For optimal ad performance, include these keywords in your headlines'), function () {
    setTimeout(() => {
        setCampaignData()
    }, 1000);
 })

function setCampaignData() {
    chrome.storage.local.get('autoCampaign', function (data) {
        // Check if 'autoCampaign' exists in the stored data
        const isExtensionOn = data.autoCampaign === undefined ? false : data.autoCampaign;
        if (!isExtensionOn) return
        getActiveCamp().then(activeCamp => {
            if (activeCamp) {
                setActiveCamp(activeCamp)
            }
        })

    });
}

function simulateCommaInput(inputElement, text) {
    // Focus on the input field
    inputElement.focus();

    // Simulate typing the text
    for (let i = 0; i < text.length; i++) {
        const keydownEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            key: text[i]
        });
        const keypressEvent = new KeyboardEvent('keypress', {
            bubbles: true,
            key: text[i]
        });
        const inputEvent = new Event('input', {
            bubbles: true
        });
        const keyupEvent = new KeyboardEvent('keyup', {
            bubbles: true,
            key: text[i]
        });

        inputElement.dispatchEvent(keydownEvent);
        inputElement.dispatchEvent(keypressEvent);
        inputElement.value += text[i];
        inputElement.dispatchEvent(inputEvent);
        inputElement.dispatchEvent(keyupEvent);
    }

    // Simulate pressing the comma key
    const commaKeydownEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        key: ','
    });
    const commaKeypressEvent = new KeyboardEvent('keypress', {
        bubbles: true,
        key: ','
    });
    const commaInputEvent = new Event('input', {
        bubbles: true
    });
    const commaKeyupEvent = new KeyboardEvent('keyup', {
        bubbles: true,
        key: ','
    });

    inputElement.dispatchEvent(commaKeydownEvent);
    inputElement.dispatchEvent(commaKeypressEvent);
    inputElement.value += ',';
    inputElement.dispatchEvent(commaInputEvent);
    inputElement.dispatchEvent(commaKeyupEvent);
}

function simulateInputEvents(inputElement, text) {
    // Simulate events
    const events = ['keydown', 'keypress', 'input', 'keyup', 'change'];

    // Loop through each event and dispatch it
    events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        inputElement.dispatchEvent(event);
        
        // For 'input' event, also update the input value
        if (eventType === 'input') {
            inputElement.value = text;
        }
    });

    // Dispatch a final 'change' event
    const changeEvent = new Event('change', { bubbles: true });
    inputElement.dispatchEvent(changeEvent);
}

function fillExpandableInputs(panelText, inputType ,addIconText, dataSource) {
     // Descriptions
     let panel = findInnermostExpansionPanelWithSpanText('material-expansionpanel', panelText)
     let inputs = panel.querySelectorAll(inputType)
     if(dataSource.length > inputs.length) {
         // max 15
         let addInputButton = findMaterialIconWithNextSibling('material-icon', 'add-icon', addIconText)
         let maxInputIterate = Math.max(6, dataSource.length - inputs.length)
         for(let i =0; i < maxInputIterate; i++){
             try {
                setTimeout(() => {
                    addInputButton.click()
                }, 200*maxInputIterate);
             } catch (error) {
                 
             }
         }
     }
     for(let i=0; i <dataSource.length; i++) {
         try {
            //  inputs[i].value = dataSource[i]
            simulateInputEvents(inputs[i], dataSource[i])
         } catch (error) {
             console.log(error);
         }
     }
}



function setActiveCamp(activeCamp) {
    try {
        let data = activeCamp.data
        document.querySelector('material-input[minerva-id="keywords-url-input"]').querySelector('input').value = data.mainSite



        let targetInput = document.querySelector('multi-suggest-input[minerva-id="keywords-product-service-input"]').querySelector('input')
        let tags = data.keywordTag
        for (let i = 0; i < tags.length; i++) {
            setTimeout(() => {
                simulateCommaInput(targetInput, tags[i])
            }, i*800);
        }

        // list keyword
        document.querySelector('textarea[aria-label="Enter or paste keywords. You can separate each keyword by commas or enter one per line."]').value = data.keywords

        document.querySelector('input[aria-label="Final URL"]').value = data.showToUserFinalUrl

        // headlines

        // let headlinePanel = findInnermostExpansionPanelWithSpanText('material-expansionpanel', 'Headlines')
        // let headlines = data.headLines
        // let headlineInputs = headlinePanel.querySelectorAll('input')
        // if(headlines.length > headlineInputs.length) {
        //     // max 15
        //     let addHeadlineButton = findMaterialIconWithNextSibling('material-icon', 'add-icon', 'Headline')
        //     let maxHeadlineIterate = Math.max(6, headlines.length - headlineInputs.length)
        //     for(let i =0; i < maxHeadlineIterate; i++){
        //         addHeadlineButton.click()
        //     }
        // }
        // for(let i=0; i <headlines.length; i++) {
        //     try {
        //         headlineInputs[i].value = headlines[i]
        //     } catch (error) {
                
        //     }
        // }

        fillExpandableInputs('Headlines', 'input' , 'Headline', data.headlines)

        fillExpandableInputs('Descriptions', 'textarea' , 'Description', data.descriptionTexts)

        

        

    } catch (error) {
        console.log(error);
    }
}

function findMaterialIconWithNextSibling(materialType, className, siblingText) {
    const elements = document.querySelectorAll(`${materialType}.${className}`);
    for (let element of elements) {
        const nextSibling = element.nextSibling;
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent.trim() === siblingText) {
            return element;
        }
    }
    return null;
}

function findInnermostExpansionPanelWithSpanText(panelType, spanText) {
    const panels = document.querySelectorAll(panelType);
    let innermostPanel = null;
    for (let panel of panels) {
        const spans = panel.querySelectorAll('span');
        for (let span of spans) {
            if (span.innerText.includes(spanText)) {
                // Check if this panel is the innermost one so far
                if (!innermostPanel || innermostPanel.contains(panel)) {
                    innermostPanel = panel;
                }
            }
        }
    }
    return innermostPanel;
}

function saveCampaignData(campName) {
    let mainSite = document.querySelector('material-input[minerva-id="keywords-url-input"]').querySelector('input').value
    // tags
    let multiInput = document.querySelector('multi-suggest-input[minerva-id="keywords-product-service-input"]')
    let allTags = []
    let tags = multiInput.querySelectorAll('div[focusitem].content')
    for (let i = 0; i < tags.length; i++) {
        allTags.push(tags[i].innerText)
    }

    let keywordsNewline = document.querySelector('textarea[aria-label="Enter or paste keywords. You can separate each keyword by commas or enter one per line."]').value

    let showToUserFinalUrl = document.querySelector('input[aria-label="Final URL"]').value

    // headline

    let headlinePanel = findInnermostExpansionPanelWithSpanText('material-expansionpanel', 'Headlines')
    let headLineTexts = []
    let headLines = headlinePanel.querySelectorAll('input')
    headLines.forEach(headline => {
        if (headline.value != '') {
            headLineTexts.push(headline.value)
        }
    });

    // description
    let descriptionsPanel = findInnermostExpansionPanelWithSpanText('material-expansionpanel', 'Descriptions')
    let descriptionTexts = []
    let descriptions = descriptionsPanel.querySelectorAll('textarea')
    descriptions.forEach(description => {
        descriptionTexts.push(description.value)
    });

    //
    // let campName = 'testcampt' //document.getElementById('campaign-name-input').value
    let campData = {
        isActive: false,
        profileName: campName,
        data: {
            mainSite: mainSite,
            headlines: headLineTexts,
            siteUrl: mainSite,
            keywordTag: allTags,
            showToUserFinalUrl: showToUserFinalUrl,
            keywords: keywordsNewline,
            descriptionTexts: descriptionTexts
        }
    };
    console.log('-------camp', campData)
    // Send message from content.js to background.js
    chrome.runtime.sendMessage({
        dataFromContent: campData
    });


}